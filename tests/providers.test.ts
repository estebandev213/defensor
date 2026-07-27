import { describe, expect, it } from "vitest";
import { createEmbeddingProvider } from "@/server/ai/providers/embedding";
import { createLLMProvider } from "@/server/ai/providers/llm";
import { ProviderUnavailableError } from "@/server/ai/providers/types";

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function requestBody(init: RequestInit | undefined): Record<string, unknown> {
  if (!init || typeof init.body !== "string") throw new Error("Expected a JSON request body.");
  return JSON.parse(init.body) as Record<string, unknown>;
}

describe("LLM provider", () => {
  it("sends a JSON-mode request and validates the structured result", async () => {
    const citationId = "11111111-1111-4111-8111-111111111111";
    const provider = createLLMProvider({
      provider: "groq",
      apiKey: "test-key",
      model: "openai/gpt-oss-120b",
      fetcher: async (input, init) => {
        expect(String(input)).toBe("https://api.groq.com/openai/v1/chat/completions");
        const body = requestBody(init);
        expect(body.response_format).toEqual({ type: "json_object" });
        expect(body.stream).toBe(false);
        return jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  answerType: "answer",
                  title: "Respuesta",
                  summary: "Resumen respaldado.",
                  sections: [{ heading: "Norma", paragraphs: ["Contenido"], citationIds: [citationId] }],
                  nextSteps: [],
                  warnings: [],
                  citationIds: [citationId],
                  confidenceLabel: "evidence_supported",
                }),
              },
            },
          ],
        });
      },
    });

    const result = await provider.generateStructured(
      { messages: [{ role: "user", content: "Consulta" }] },
      (await import("@/server/ai/schemas")).LegalAnswerSchema,
    );

    expect(result.answerType).toBe("answer");
    expect(result.citationIds).toEqual([citationId]);
  });

  it("maps provider HTTP errors without exposing response bodies", async () => {
    const provider = createLLMProvider({
      provider: "groq",
      apiKey: "test-key",
      model: "test-model",
      fetcher: async () => jsonResponse({ secret: "must-not-leak" }, 401),
    });

    await expect(
      provider.generateStructured(
        { messages: [{ role: "user", content: "Consulta" }] },
        (await import("@/server/ai/schemas")).LegalAnswerSchema,
      ),
    ).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
      provider: "llm",
      message: "llm provider returned HTTP 401.",
    });
  });
});

describe("embedding provider", () => {
  it("preserves batch order and validates configured dimensions", async () => {
    const provider = createEmbeddingProvider({
      provider: "jina",
      apiKey: "test-key",
      model: "jina-embeddings-v3",
      dimensions: 3,
      fetcher: async (input, init) => {
        expect(String(input)).toBe("https://api.jina.ai/v1/embeddings");
        const body = requestBody(init);
        expect(body.dimensions).toBe(3);
        return jsonResponse({
          data: [
            { index: 1, embedding: [0.2, 0.3, 0.4] },
            { index: 0, embedding: [0.1, 0.2, 0.3] },
          ],
        });
      },
    });

    await expect(provider.embedDocuments(["uno", "dos"])).resolves.toEqual([
      [0.1, 0.2, 0.3],
      [0.2, 0.3, 0.4],
    ]);
  });

  it("rejects unsupported providers", () => {
    expect(() =>
      createEmbeddingProvider({
        provider: "unknown",
        apiKey: "test-key",
        model: "test-model",
      }),
    ).toThrow(ProviderUnavailableError);
  });
});
