import { NextResponse } from "next/server";
import { createDatabaseClient } from "@/db/client";
import type { LegalSource } from "@/db/types";
import {
  LegalAnswerDraftSchema,
  emptyCaseProfile,
  type CaseProfile,
  type QueryClassification,
  type TurnPlan,
} from "@/server/ai/schemas";
import { buildLegalAnswerPrompt } from "@/server/ai/prompts/legal-answer";
import {
  createEmbeddingProviderFromEnv,
  createLLMProviderFromEnv,
  ProviderRateLimitError,
  ProviderUnavailableError,
} from "@/server/ai/providers";
import type { LLMMessage, LLMProvider } from "@/server/ai/providers/types";
import { publicError } from "@/server/security/errors";
import { env } from "@/server/security/env";
import { logger } from "@/server/security/logger";
import { requestClientIdentifier, defaultRateLimiter } from "@/server/security/rate-limit";
import { AbortError, TimeoutError, withTimeout } from "@/server/security/timeout";
import { telemetry } from "@/server/telemetry/in-memory";
import {
  createClarificationAnswer,
  createConversationalAnswer,
  createSafeAbstention,
  evaluateEvidence,
} from "@/server/safety/evidence";
import { classifyQuery, supportedCategories } from "@/server/safety/classify";
import { asResearchTurn, clarificationFromPlan, plannedCaseProfile, planTurn } from "@/server/safety/turn-plan";
import { validateCitations } from "@/server/safety/citations";
import type { ValidatedCitation } from "@/server/safety/types";
import { PostgresLegalCatalogRepository } from "@/server/legal/repository";
import { ChatRequestSchema } from "@/server/ai/chat-schema";
import type { RetrievedChunk } from "@/server/rag/types";

const KNOWN_REGIMES = ["privado_general", "mype", "cas", "agrario", "hogar", "construccion_civil"];

type ChatEvent =
  | { type: "stage"; id: string; label: string; state: "active" | "done"; detail?: string }
  | { type: "understanding"; text: string }
  | {
      type: "answer";
      answerId: string;
      answer: unknown;
      citations: ValidatedCitation[];
      caseProfile: CaseProfile;
      reasoning: { understanding: string; steps: { label: string; detail?: string }[] };
    }
  | { type: "error"; code: string; retryAfterSeconds?: number };

interface RetrievedEvidence {
  chunks: RetrievedChunk[];
  sources: Map<string, LegalSource>;
}

function hasConfiguredCorpus(): boolean {
  return Boolean(env.DATABASE_URL && env.LEGAL_CORPUS_VERSION);
}

/**
 * The planner writes the case profile in free text, so retrieval filters only
 * accept values that exist in the corpus vocabulary.
 */
function retrievalCategory(plan: TurnPlan, classification: QueryClassification): string {
  const planned = plan.caseProfile.topic;
  if (planned && (supportedCategories as readonly string[]).includes(planned)) return planned;
  return classification.category;
}

function retrievalRegime(plan: TurnPlan, classification: QueryClassification): string {
  const planned = plan.caseProfile.regime;
  if (planned && KNOWN_REGIMES.includes(planned)) return planned;
  return classification.possibleRegimes[0] ?? "privado_general";
}

async function retrieveEvidence(
  queries: readonly string[],
  category: string,
  regime: string,
): Promise<RetrievedEvidence> {
  if (!hasConfiguredCorpus()) return { chunks: [], sources: new Map() };

  const db = createDatabaseClient();
  try {
    const embeddingProvider = createEmbeddingProviderFromEnv();
    const repository = new PostgresLegalCatalogRepository(db, embeddingProvider);

    let chunks: RetrievedChunk[] = [];
    for (const query of queries.slice(0, 2)) {
      chunks = await repository.hybridSearch({
        query,
        legalRegime: regime,
        topics: category === "general" ? undefined : [category],
        semanticLimit: 8,
        lexicalLimit: 8,
        finalLimit: 5,
      });
      if (chunks.length > 0) break;
    }

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

function optionalLLMProvider(): LLMProvider | null {
  try {
    return createLLMProviderFromEnv();
  } catch {
    return null;
  }
}

function errorCodeFor(error: unknown): string {
  // Checked before the base class: a rate limit is a wait, not an outage, and
  // the client must not retry it.
  if (error instanceof ProviderRateLimitError) return "RATE_LIMITED";
  if (error instanceof ProviderUnavailableError) {
    return error.provider === "embedding" ? "EMBEDDING_PROVIDER_ERROR" : "LLM_PROVIDER_ERROR";
  }
  if (error instanceof TimeoutError) return "TIMEOUT";
  return "INTERNAL_ERROR";
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
  if (userMessages.length === 0) {
    return NextResponse.json(publicError("VALIDATION_ERROR"), { status: 400 });
  }

  const conversation = parsed.data.messages.slice(-10).map((message): LLMMessage => ({
    role: message.role,
    content: message.content,
  }));
  const conversationQuery = userMessages.slice(-3).map((message) => message.content).join("\n");
  const incomingProfile = parsed.data.caseProfile ?? emptyCaseProfile;
  const style = parsed.data.style;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reasoningSteps: { label: string; detail?: string }[] = [];
      const emit = (event: ChatEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      const stage = (id: string, label: string, state: "active" | "done", detail?: string) => {
        if (state === "done") reasoningSteps.push({ label, detail });
        emit({ type: "stage", id, label, state, detail });
      };

      try {
        const classification = classifyQuery(conversationQuery);
        const planLabel = "Entendiendo tu situación";
        stage("plan", planLabel, "active");

        const planned = await planTurn({
          llm: optionalLLMProvider(),
          conversation,
          caseProfile: incomingProfile,
          classification,
          timeoutMs: env.REQUEST_TIMEOUT_MS,
          signal: request.signal,
        });
        const plan = style === "simple" ? asResearchTurn(planned) : planned;
        stage("plan", plan.reasoningSteps[0]?.label ?? planLabel, "done");
        emit({ type: "understanding", text: plan.understanding });

        const clarification = clarificationFromPlan(plan);
        let answer = createConversationalAnswer(plan);
        let citations: ValidatedCitation[] = [];
        let retrieved: RetrievedEvidence = { chunks: [], sources: new Map() };
        let evidenceReason = "conversational_turn";

        if (plan.action === "ask") {
          answer = createClarificationAnswer(plan);
          evidenceReason = "missing_material_fact";
        } else if (plan.riskFlags.includes("emergency") || plan.riskFlags.includes("out_of_scope")) {
          // The gate abstains no matter what comes back, so do not spend a
          // retrieval round trip or show search stages that mean nothing.
          const evidence = evaluateEvidence({ classification, clarification, chunks: [] });
          evidenceReason = evidence.reasonCode;
          answer = createSafeAbstention(evidence);
        } else if (plan.action === "research") {
          const searchLabel = plan.reasoningSteps[1]?.label ?? "Buscando en normas oficiales";
          stage("search", searchLabel, "active");
          retrieved = await withTimeout(
            retrieveEvidence(
              plan.searchQueries,
              retrievalCategory(plan, classification),
              retrievalRegime(plan, classification),
            ),
            env.REQUEST_TIMEOUT_MS,
            request.signal,
          );
          stage(
            "search",
            searchLabel,
            "done",
            retrieved.chunks.length === 1
              ? "1 artículo relevante"
              : `${retrieved.chunks.length} artículos relevantes`,
          );

          const verifyLabel =
            plan.reasoningSteps[2]?.label ?? "Verificando que cada afirmación tenga respaldo";
          stage("verify", verifyLabel, "active");

          const evidence = evaluateEvidence({ classification, clarification, chunks: retrieved.chunks });
          evidenceReason = evidence.reasonCode;
          answer = createSafeAbstention(evidence);

          if (evidence.action === "answer") {
            const supportingChunks = retrieved.chunks.filter((chunk) =>
              evidence.supportingChunkIds.includes(chunk.id),
            );
            const llm = createLLMProviderFromEnv();
            const draft = await withTimeout(
              llm.generateStructured(
                buildLegalAnswerPrompt({
                  conversation,
                  classification,
                  caseProfile: plan.caseProfile,
                  understanding: plan.understanding,
                  chunks: supportingChunks,
                  style,
                }),
                LegalAnswerDraftSchema,
              ),
              env.REQUEST_TIMEOUT_MS,
              request.signal,
            );
            const validated = validateCitations({
              answer: draft,
              chunks: retrieved.chunks,
              sources: retrieved.sources,
            });
            answer = validated.answer;
            if (validated.ok) citations = validated.citations;
          }

          stage(
            "verify",
            verifyLabel,
            "done",
            citations.length > 0 ? `${citations.length} fuentes confirmadas` : undefined,
          );
        }

        void telemetry.trace({
          traceId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          route: "/api/chat",
          category: classification.category,
          coverageStatus: classification.coverageStatus,
          timings: { total: Date.now() - startedAt },
          retrievedChunkIds: retrieved.chunks.map((chunk) => chunk.id),
          evidenceDecision: evidenceReason,
          citedChunkIds: citations.map((citation) => citation.id),
        });
        logger.info("chat_evidence_decision", {
          category: classification.category,
          coverageStatus: classification.coverageStatus,
          evidenceDecision: evidenceReason,
          retrievedCount: retrieved.chunks.length,
          citedCount: citations.length,
          totalMs: Date.now() - startedAt,
        });

        emit({
          type: "answer",
          answerId: crypto.randomUUID(),
          answer,
          citations,
          caseProfile: plannedCaseProfile(plan),
          reasoning: { understanding: plan.understanding, steps: reasoningSteps },
        });
      } catch (error) {
        if (!(error instanceof AbortError)) {
          emit({
            type: "error",
            code: errorCodeFor(error),
            ...(error instanceof ProviderRateLimitError && error.retryAfterSeconds !== null
              ? { retryAfterSeconds: error.retryAfterSeconds }
              : {}),
          });
        }
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
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
