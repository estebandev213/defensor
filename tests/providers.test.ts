import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { createEmbeddingProvider } from "@/server/ai/providers/embedding";
import { createLLMProvider, FailoverLLMProvider } from "@/server/ai/providers/llm";
import {
  ProviderRateLimitError,
  ProviderUnavailableError,
  type LLMProvider,
  type LLMStructuredInput,
} from "@/server/ai/providers/types";

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
                  reply: [{ text: "Contenido respaldado.", isLegalClaim: true, citationIds: [citationId] }],
                  followUpQuestion: null,
                  quickReplies: [],
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

  it("separates an upstream rate limit from an outage and keeps the wait hint", async () => {
    const provider = createLLMProvider({
      provider: "groq",
      apiKey: "test-key",
      model: "openai/gpt-oss-120b",
      fetcher: async () =>
        jsonResponse(
          {
            error: {
              message:
                "Rate limit reached for model `openai/gpt-oss-120b` on tokens per minute (TPM): Limit 8000, Used 2954, Requested 6976. Please try again in 14.475s.",
              code: "rate_limit_exceeded",
            },
          },
          429,
        ),
    });

    await expect(
      provider.generateStructured(
        { messages: [{ role: "user", content: "Consulta" }] },
        (await import("@/server/ai/schemas")).LegalAnswerSchema,
      ),
    ).rejects.toMatchObject({
      code: "PROVIDER_RATE_LIMITED",
      provider: "llm",
      retryAfterSeconds: 15,
    });
  });

  it("prefers the Retry-After header over the message hint", async () => {
    const provider = createLLMProvider({
      provider: "groq",
      apiKey: "test-key",
      model: "openai/gpt-oss-120b",
      fetcher: async () =>
        new Response(JSON.stringify({ error: { message: "Please try again in 14.475s." } }), {
          status: 429,
          headers: { "content-type": "application/json", "retry-after": "42" },
        }),
    });

    await expect(
      provider.generateStructured(
        { messages: [{ role: "user", content: "Consulta" }] },
        (await import("@/server/ai/schemas")).LegalAnswerSchema,
      ),
    ).rejects.toMatchObject({ code: "PROVIDER_RATE_LIMITED", retryAfterSeconds: 42 });
  });

  it("reports a rate limit with no usable hint as an unknown wait", async () => {
    const provider = createLLMProvider({
      provider: "groq",
      apiKey: "test-key",
      model: "openai/gpt-oss-120b",
      fetcher: async () => jsonResponse({ error: { message: "Too many requests." } }, 429),
    });

    await expect(
      provider.generateStructured(
        { messages: [{ role: "user", content: "Consulta" }] },
        (await import("@/server/ai/schemas")).LegalAnswerSchema,
      ),
    ).rejects.toMatchObject({ code: "PROVIDER_RATE_LIMITED", retryAfterSeconds: null });
  });

  it("keeps the reserved output budget small enough to survive a per-minute quota", async () => {
    const { buildLegalAnswerPrompt } = await import("@/server/ai/prompts/legal-answer");
    const { buildTurnPlannerPrompt } = await import("@/server/ai/prompts/turn-planner");
    const { emptyCaseFacts, emptyCaseProfile } = await import("@/server/ai/schemas");
    const { classifyQuery } = await import("@/server/safety/classify");

    const classification = classifyQuery("No me pagan la CTS");
    const answer = buildLegalAnswerPrompt({
      conversation: [{ role: "user", content: "No me pagan la CTS" }],
      classification,
      caseProfile: emptyCaseFacts,
      understanding: "No te pagan la CTS.",
      chunks: [],
    });
    const plan = buildTurnPlannerPrompt({
      conversation: [{ role: "user", content: "No me pagan la CTS" }],
      caseProfile: emptyCaseProfile,
      classification,
    });

    // Providers reserve the full budget against the quota at request time, and a
    // turn spends both calls, so their sum is what has to fit in one window.
    expect((answer.maxOutputTokens ?? 0) + (plan.maxOutputTokens ?? 0)).toBeLessThanOrEqual(3_200);
  });
});

describe("LLM failover", () => {
  const answer = {
    answerType: "abstention",
    reply: [{ text: "Sin evidencia suficiente.", isLegalClaim: false, citationIds: [] }],
    followUpQuestion: null,
    quickReplies: [],
    citationIds: [],
    confidenceLabel: "insufficient_evidence",
  };

  function provider(behaviour: () => Promise<unknown>): LLMProvider {
    return {
      streamAnswer: () => Promise.reject(new Error("not used")),
      generateStructured: async <T>(_input: LLMStructuredInput, schema: z.ZodSchema<T>) =>
        schema.parse(await behaviour()),
    };
  }

  async function run(providers: LLMProvider[]) {
    return new FailoverLLMProvider(providers).generateStructured(
      { messages: [{ role: "user", content: "Consulta" }] },
      (await import("@/server/ai/schemas")).LegalAnswerSchema,
    );
  }

  it("moves to the second provider when the first is rate limited", async () => {
    let secondCalled = false;
    const result = await run([
      provider(() => Promise.reject(new ProviderRateLimitError("limit", "llm", 15))),
      provider(() => {
        secondCalled = true;
        return Promise.resolve(answer);
      }),
    ]);

    expect(secondCalled).toBe(true);
    expect(result.answerType).toBe("abstention");
  });

  it("moves to the second provider when the first is simply down", async () => {
    const result = await run([
      provider(() => Promise.reject(new ProviderUnavailableError("down", "llm"))),
      provider(() => Promise.resolve(answer)),
    ]);

    expect(result.answerType).toBe("abstention");
  });

  it("does not call the fallback when the primary succeeds", async () => {
    let secondCalled = false;
    await run([
      provider(() => Promise.resolve(answer)),
      provider(() => {
        secondCalled = true;
        return Promise.resolve(answer);
      }),
    ]);

    expect(secondCalled).toBe(false);
  });

  it("reports the soonest recovery when every provider is rate limited", async () => {
    await expect(
      run([
        provider(() => Promise.reject(new ProviderRateLimitError("limit", "llm", 40))),
        provider(() => Promise.reject(new ProviderRateLimitError("limit", "llm", 9))),
      ]),
    ).rejects.toMatchObject({ code: "PROVIDER_RATE_LIMITED", retryAfterSeconds: 9 });
  });

  it("keeps the last real failure when the providers fail for different reasons", async () => {
    await expect(
      run([
        provider(() => Promise.reject(new ProviderRateLimitError("limit", "llm", 40))),
        provider(() => Promise.reject(new ProviderUnavailableError("down", "llm"))),
      ]),
    ).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
  });

  it("stops the chain on a non-provider error instead of spending the fallback", async () => {
    let secondCalled = false;
    await expect(
      run([
        provider(() => Promise.reject(new Error("aborted"))),
        provider(() => {
          secondCalled = true;
          return Promise.resolve(answer);
        }),
      ]),
    ).rejects.toThrow("aborted");
    expect(secondCalled).toBe(false);
  });

  it("targets Gemini's OpenAI-compatible endpoint with the token field it reads", async () => {
    let seenUrl = "";
    let seenBody: Record<string, unknown> = {};
    const gemini = createLLMProvider({
      provider: "gemini",
      apiKey: "test-key",
      model: "gemini-2.0-flash",
      fetcher: async (input, init) => {
        seenUrl = String(input);
        seenBody = requestBody(init);
        return jsonResponse({ choices: [{ message: { content: JSON.stringify(answer) } }] });
      },
    });

    await gemini.generateStructured(
      { messages: [{ role: "user", content: "Consulta" }], maxOutputTokens: 2000 },
      (await import("@/server/ai/schemas")).LegalAnswerSchema,
    );

    expect(seenUrl).toBe("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
    expect(seenBody.max_tokens).toBe(2000);
    expect(seenBody.max_completion_tokens).toBeUndefined();
  });

  it("keeps max_completion_tokens for the OpenAI-style providers", async () => {
    let seenBody: Record<string, unknown> = {};
    const groq = createLLMProvider({
      provider: "groq",
      apiKey: "test-key",
      model: "openai/gpt-oss-120b",
      fetcher: async (_input, init) => {
        seenBody = requestBody(init);
        return jsonResponse({ choices: [{ message: { content: JSON.stringify(answer) } }] });
      },
    });

    await groq.generateStructured(
      { messages: [{ role: "user", content: "Consulta" }], maxOutputTokens: 2000 },
      (await import("@/server/ai/schemas")).LegalAnswerSchema,
    );

    expect(seenBody.max_completion_tokens).toBe(2000);
    expect(seenBody.max_tokens).toBeUndefined();
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
