import { describe, expect, it } from "vitest";
import { parseChatTransportResult, readChatStream } from "@/features/chat/transport";

const answer = {
  answerType: "abstention",
  title: "No puedo responder con seguridad",
  summary: "No encontré evidencia suficiente.",
  sections: [],
  nextSteps: [],
  warnings: [],
  citationIds: [],
  confidenceLabel: "insufficient_evidence",
};

describe("chat transport", () => {
  it("parses the final event from an SSE response", async () => {
    const payload = { answerId: "answer-1", answer, citations: [] };
    const response = new Response(`data: ${JSON.stringify(payload)}\n\ndata: [DONE]\n\n`);

    await expect(readChatStream(response)).resolves.toEqual(payload);
  });

  it("rejects malformed response payloads", () => {
    expect(parseChatTransportResult({ answerId: "answer-1" })).toBeNull();
  });
});
