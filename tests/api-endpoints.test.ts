import { describe, expect, it } from "vitest";
import { POST as postFeedback } from "@/app/api/feedback/route";
import { GET as getSource } from "@/app/api/sources/[id]/route";
import { sanitizeFeedbackComment } from "@/server/feedback/schema";

describe("POST /api/feedback", () => {
  it("rejects malformed feedback without touching the database", async () => {
    const response = await postFeedback(new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({ rating: "helpful" }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "VALIDATION_ERROR" });
  });

  it("returns a safe unavailable response when the database is not configured", async () => {
    const response = await postFeedback(new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: "11111111-1111-4111-8111-111111111111",
        answerId: "22222222-2222-4222-8222-222222222222",
        rating: "helpful",
      }),
    }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "DATABASE_UNAVAILABLE" });
  });
});

describe("GET /api/sources/:id", () => {
  it("rejects an invalid source id", async () => {
    const response = await getSource(new Request("http://localhost/api/sources/not-an-id"), {
      params: Promise.resolve({ id: "not-an-id" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "VALIDATION_ERROR" });
  });

  it("returns a safe unavailable response when the database is not configured", async () => {
    const response = await getSource(new Request("http://localhost/api/sources/11111111-1111-4111-8111-111111111111"), {
      params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "DATABASE_UNAVAILABLE" });
  });
});

describe("feedback sanitization", () => {
  it("removes control characters and redacts personal identifiers", () => {
    const result = sanitizeFeedbackComment("Correo test@example.com, DNI 12345678\u0000 y teléfono 999888777.");

    expect(result).toContain("[EMAIL_REDACTED]");
    expect(result).toContain("[DNI_REDACTED]");
    expect(result).toContain("[PHONE_REDACTED]");
    expect(result).not.toContain("\u0000");
  });
});
