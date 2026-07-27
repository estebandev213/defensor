import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/chat/route";

describe("POST /api/chat", () => {
  it("returns a safe clarification over the streaming transport", async () => {
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
    expect(body).toContain('"answerType":"clarification"');
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
