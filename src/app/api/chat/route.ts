import { NextResponse } from "next/server";
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
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const lastUserMessage = [...parsed.data.messages].reverse().find((message) => message.role === "user");
  if (!lastUserMessage) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const classification = classifyQuery(lastUserMessage.content);
  const clarification = runClarificationGate(classification);
  const evidence = evaluateEvidence({
    classification,
    clarification,
    chunks: [],
  });
  const answer =
    evidence.action === "clarify"
      ? createClarificationAnswer(classification)
      : createSafeAbstention(evidence);

  return streamResult({
    answerId: crypto.randomUUID(),
    answer,
    citations: [],
  });
}
