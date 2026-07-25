import { NextResponse } from "next/server";
import { publicError } from "@/server/security/errors";
import { env } from "@/server/security/env";
import { requestClientIdentifier, defaultRateLimiter } from "@/server/security/rate-limit";
import { AbortError, TimeoutError, withTimeout } from "@/server/security/timeout";
import { telemetry } from "@/server/telemetry/in-memory";
import { createClarificationAnswer, createSafeAbstention, evaluateEvidence } from "@/server/safety/evidence";
import { classifyQuery } from "@/server/safety/classify";
import { runClarificationGate } from "@/server/safety/clarification";
import { ChatRequestSchema } from "@/server/ai/chat-schema";

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

  const lastUserMessage = [...parsed.data.messages].reverse().find((message) => message.role === "user");
  if (!lastUserMessage) {
    return NextResponse.json(publicError("VALIDATION_ERROR"), { status: 400 });
  }

  try {
    const result = await withTimeout(
      Promise.resolve().then(() => {
        const classification = classifyQuery(lastUserMessage.content);
        const clarification = runClarificationGate(classification);
        const evidence = evaluateEvidence({ classification, clarification, chunks: [] });
        const answer = evidence.action === "clarify" ? createClarificationAnswer(classification) : createSafeAbstention(evidence);
        return { classification, evidence, answer };
      }),
      env.REQUEST_TIMEOUT_MS,
      request.signal,
    );

    void telemetry.trace({
      traceId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      route: "/api/chat",
      category: result.classification.category,
      coverageStatus: result.classification.coverageStatus,
      timings: { total: Date.now() - startedAt },
      retrievedChunkIds: [],
      evidenceDecision: result.evidence.reasonCode,
      citedChunkIds: [],
    });

    return streamResult({ answerId: crypto.randomUUID(), answer: result.answer, citations: [] });
  } catch (error) {
    const code = error instanceof TimeoutError ? "TIMEOUT" : error instanceof AbortError ? "INTERNAL_ERROR" : "INTERNAL_ERROR";
    return NextResponse.json(publicError(code), { status: code === "TIMEOUT" ? 504 : 499 });
  }
}
