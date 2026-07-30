import { describe, expect, it } from "vitest";
import { parseChatTransportResult, readChatStream } from "@/features/chat/transport";

const answer = {
  answerType: "abstention",
  reply: [{ text: "No encontré evidencia suficiente.", isLegalClaim: false, citationIds: [] }],
  followUpQuestion: null,
  quickReplies: [],
  citationIds: [],
  confidenceLabel: "insufficient_evidence",
};

describe("chat transport", () => {
  it("parses the final event from an SSE response", async () => {
    const payload = { answerId: "answer-1", answer, citations: [] };
    const response = new Response(`data: ${JSON.stringify(payload)}\n\ndata: [DONE]\n\n`);

    await expect(readChatStream(response)).resolves.toEqual({
      ...payload,
      caseProfile: null,
      reasoning: null,
    });
  });

  it("surfaces reasoning stages before the final answer", async () => {
    const frames = [
      { type: "stage", id: "plan", label: "Entendiendo tu situación", state: "active" },
      { type: "understanding", text: "Te despidieron y no sabes qué te corresponde." },
      { type: "stage", id: "plan", label: "Entendiendo tu situación", state: "done" },
      { answerId: "answer-1", answer, citations: [] },
    ];
    const response = new Response(
      `${frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join("")}data: [DONE]\n\n`,
    );

    const seen: string[] = [];
    const result = await readChatStream(response, (event) => {
      seen.push(event.type === "stage" ? `${event.id}:${event.state}` : event.type);
    });

    expect(seen).toEqual(["plan:active", "understanding", "plan:done"]);
    expect(result?.answerId).toBe("answer-1");
  });

  it("rejects malformed response payloads", () => {
    expect(parseChatTransportResult({ answerId: "answer-1" })).toBeNull();
  });

  it("carries the wait hint on a rate-limit error frame", async () => {
    const response = new Response(
      `data: ${JSON.stringify({ type: "error", code: "RATE_LIMITED", retryAfterSeconds: 15 })}\n\ndata: [DONE]\n\n`,
    );

    const events: unknown[] = [];
    await expect(readChatStream(response, (event) => events.push(event))).resolves.toBeNull();
    expect(events).toEqual([{ type: "error", code: "RATE_LIMITED", retryAfterSeconds: 15 }]);
  });

  it("omits a non-numeric wait hint instead of passing it through", async () => {
    const response = new Response(
      `data: ${JSON.stringify({ type: "error", code: "RATE_LIMITED", retryAfterSeconds: "pronto" })}\n\ndata: [DONE]\n\n`,
    );

    const events: unknown[] = [];
    await readChatStream(response, (event) => events.push(event));
    expect(events).toEqual([{ type: "error", code: "RATE_LIMITED" }]);
  });
});
