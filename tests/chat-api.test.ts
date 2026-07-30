import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/chat/route";

describe("POST /api/chat", () => {
  it("returns a safe response over the streaming transport without forcing a regime question", async () => {
    const response = await POST(new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: "11111111-1111-4111-8111-111111111111",
        messages: [{ role: "user", content: "Me despidieron" }],
        locale: "es-PE",
      }),
    }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(body).toContain('"answerType":"abstention"');
    expect(body).not.toContain("régimen laboral privado general o inscrito en REMYPE");
  });

  it("streams reasoning stages before the validated answer", async () => {
    const response = await POST(new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: "33333333-3333-4333-8333-333333333333",
        messages: [{ role: "user", content: "Me despidieron" }],
        locale: "es-PE",
      }),
    }));
    const body = await response.text();
    const stagePosition = body.indexOf('"type":"stage"');
    const answerPosition = body.indexOf('"type":"answer"');

    expect(stagePosition).toBeGreaterThanOrEqual(0);
    expect(body).toContain('"type":"understanding"');
    expect(stagePosition).toBeLessThan(answerPosition);
    expect(body.endsWith("data: [DONE]\n\n")).toBe(true);
  });

  it("keeps the case profile the client sends without trusting it for legal claims", async () => {
    const response = await POST(new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: "44444444-4444-4444-8444-444444444444",
        messages: [{ role: "user", content: "¿Me corresponde CTS?" }],
        caseProfile: {
          topic: "cts",
          regime: "mype",
          terminationDate: null,
          contractType: null,
          tenure: null,
          otherFacts: [],
          questionsAsked: 0,
        },
        locale: "es-PE",
      }),
    }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"regime":"mype"');
    expect(body).not.toContain('"answerType":"answer"');
  });

  it("accepts a plainer-explanation turn without asking another question", async () => {
    const response = await POST(new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: "55555555-5555-4555-8555-555555555555",
        messages: [
          { role: "user", content: "¿Me corresponde CTS?" },
          { role: "assistant", content: "Te explico lo que dice la norma." },
          { role: "user", content: "Explícamelo más simple, por favor." },
        ],
        style: "simple",
        locale: "es-PE",
      }),
    }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"answerType":"abstention"');
    expect(body).not.toContain('"answerType":"clarification"');
  });

  it("rejects malformed requests without exposing details", async () => {
    const response = await POST(new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "VALIDATION_ERROR" });
  });

  it("keeps the clarification context on the next user turn", async () => {
    const response = await POST(new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: "22222222-2222-4222-8222-222222222222",
        messages: [
          { role: "user", content: "Me despidieron" },
          { role: "assistant", content: "¿Tu empleador estaba bajo el régimen laboral privado general o inscrito en REMYPE?" },
          { role: "user", content: "Régimen privado general" },
        ],
        locale: "es-PE",
      }),
    }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"answerType":"abstention"');
    expect(body).not.toContain('"answerType":"clarification"');
  });
});
