import { NextResponse } from "next/server";
import { createDatabaseClient } from "@/db/client";
import type { LegalSource } from "@/db/types";
import { LegalAnswerSchema } from "@/server/ai/schemas";
import { buildLegalAnswerPrompt } from "@/server/ai/prompts/legal-answer";
import {
  createEmbeddingProviderFromEnv,
  createLLMProviderFromEnv,
  ProviderUnavailableError,
} from "@/server/ai/providers";
import type { LLMMessage } from "@/server/ai/providers/types";
import { publicError } from "@/server/security/errors";
import { env } from "@/server/security/env";
import { requestClientIdentifier, defaultRateLimiter } from "@/server/security/rate-limit";
import { AbortError, TimeoutError, withTimeout } from "@/server/security/timeout";
import { telemetry } from "@/server/telemetry/in-memory";
import { createClarificationAnswer, createSafeAbstention, evaluateEvidence } from "@/server/safety/evidence";
import { classifyQuery } from "@/server/safety/classify";
import { runClarificationGate } from "@/server/safety/clarification";
import { validateCitations } from "@/server/safety/citations";
import type { ValidatedCitation } from "@/server/safety/types";
import { PostgresLegalCatalogRepository } from "@/server/legal/repository";
import { ChatRequestSchema } from "@/server/ai/chat-schema";
import type { RetrievedChunk } from "@/server/rag/types";

function streamResult(payload: unknown): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}

interface RetrievedEvidence {
  chunks: RetrievedChunk[];
  sources: Map<string, LegalSource>;
}

function hasConfiguredCorpus(): boolean {
  return Boolean(env.DATABASE_URL && env.LEGAL_CORPUS_VERSION);
}

function normalizeRegimeReply(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function retrievalQueryForConversation(
  userMessages: readonly { content: string }[],
  fallback: string,
): string {
  const lastMessage = userMessages.at(-1);
  if (!lastMessage || userMessages.length < 2 || /[?¿]/.test(lastMessage.content)) {
    return fallback;
  }

  const normalized = normalizeRegimeReply(lastMessage.content);
  const isRegimeReply =
    normalized.length <= 80 &&
    (normalized.includes("privado general") ||
      normalized.includes("remype") ||
      normalized.includes("mype") ||
      normalized.includes("microempresa") ||
      normalized.includes("pequena empresa"));

  return isRegimeReply ? userMessages.at(-2)?.content ?? fallback : fallback;
}

async function retrieveEvidence(query: string, category: string, regime: string): Promise<RetrievedEvidence> {
  if (!hasConfiguredCorpus()) return { chunks: [], sources: new Map() };

  const db = createDatabaseClient();
  try {
    const embeddingProvider = createEmbeddingProviderFromEnv();
    const repository = new PostgresLegalCatalogRepository(db, embeddingProvider);
    const chunks = await repository.hybridSearch({
      query,
      legalRegime: regime,
      topics: category === "general" ? undefined : [category],
      semanticLimit: 8,
      lexicalLimit: 8,
      finalLimit: 5,
    });
    const sourceIds = [...new Set(chunks.map((chunk) => chunk.sourceId))];
    const sources = new Map<string, LegalSource>();
    for (const sourceId of sourceIds) {
      const source = await repository.getSourceById(sourceId);
      if (source) sources.set(source.id, source);
    }
    return { chunks, sources };
  } finally {
    await db.end({ timeout: 1 }).catch(() => undefined);
  }
}

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(publicError("VALIDATION_ERROR"), { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(publicError("VALIDATION_ERROR"), { status: 400 });
  }

  const rateLimit = await defaultRateLimiter.check({
    clientIdentifier: requestClientIdentifier(request),
    sessionId: parsed.data.sessionId,
    route: "/api/chat",
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(publicError("RATE_LIMITED"), {
      status: 429,
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds),
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": "0",
      },
    });
  }

  const userMessages = parsed.data.messages.filter((message) => message.role === "user");
  const lastUserMessage = userMessages.at(-1);
  if (!lastUserMessage) {
    return NextResponse.json(publicError("VALIDATION_ERROR"), { status: 400 });
  }

  const conversationQuery = userMessages.slice(-3).map((message) => message.content).join("\n");
  const retrievalQuery = retrievalQueryForConversation(userMessages, conversationQuery);

  try {
    const result = await withTimeout(
      Promise.resolve().then(() => {
        const classification = classifyQuery(conversationQuery);
        const clarification = runClarificationGate(classification);
        return { classification, clarification };
      }),
      env.REQUEST_TIMEOUT_MS,
      request.signal,
    );

    const retrieved = result.clarification.action === "continue"
      ? await withTimeout(
          retrieveEvidence(
            retrievalQuery,
            result.classification.category,
            result.classification.possibleRegimes[0] ?? "privado_general",
          ),
          env.REQUEST_TIMEOUT_MS,
          request.signal,
        )
      : { chunks: [], sources: new Map<string, LegalSource>() };
    const evidence = evaluateEvidence({
      classification: result.classification,
      clarification: result.clarification,
      chunks: retrieved.chunks,
    });
    let answer = evidence.action === "clarify"
      ? createClarificationAnswer(result.classification)
      : createSafeAbstention(evidence);
    let citations: ValidatedCitation[] = [];

    if (evidence.action === "answer") {
      const supportingChunks = retrieved.chunks.filter((chunk) => evidence.supportingChunkIds.includes(chunk.id));
      const llm = createLLMProviderFromEnv();
      const conversation = parsed.data.messages.slice(-6).map((message): LLMMessage => ({
        role: message.role,
        content: message.content,
      }));
      const draft = await withTimeout(
        llm.generateStructured(
          buildLegalAnswerPrompt({
            conversation,
            classification: result.classification,
            chunks: supportingChunks,
          }),
          LegalAnswerSchema,
        ),
        env.REQUEST_TIMEOUT_MS,
        request.signal,
      );
      const validated = validateCitations({ answer: draft, chunks: retrieved.chunks, sources: retrieved.sources });
      if (validated.ok) {
        answer = validated.answer;
        citations = validated.citations;
      } else {
        answer = validated.answer;
      }
    }

    void telemetry.trace({
      traceId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      route: "/api/chat",
      category: result.classification.category,
      coverageStatus: result.classification.coverageStatus,
      timings: { total: Date.now() - startedAt },
      retrievedChunkIds: retrieved.chunks.map((chunk) => chunk.id),
      evidenceDecision: evidence.reasonCode,
      citedChunkIds: citations.map((citation) => citation.id),
    });

    return streamResult({ answerId: crypto.randomUUID(), answer, citations });
  } catch (error) {
    if (error instanceof ProviderUnavailableError) {
      const providerCode = error.provider === "embedding" ? "EMBEDDING_PROVIDER_ERROR" : "LLM_PROVIDER_ERROR";
      return NextResponse.json(publicError(providerCode), { status: 503 });
    }
    const code = error instanceof TimeoutError ? "TIMEOUT" : error instanceof AbortError ? "INTERNAL_ERROR" : "INTERNAL_ERROR";
    return NextResponse.json(publicError(code), { status: code === "TIMEOUT" ? 504 : 499 });
  }
}
