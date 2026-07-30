import { describe, expect, it } from "vitest";
import { z } from "zod";
import { emptyCaseFacts, emptyCaseProfile, type CaseFacts, type TurnPlan } from "@/server/ai/schemas";
import {
  ProviderRateLimitError,
  ProviderUnavailableError,
  type LLMProvider,
  type LLMStructuredInput,
} from "@/server/ai/providers/types";
import { classifyQuery } from "@/server/safety/classify";
import {
  applySafetyVeto,
  clarificationFromPlan,
  containsLegalAssertion,
  fallbackTurnPlan,
  MAX_CONSECUTIVE_QUESTIONS,
  plannedCaseProfile,
  planTurn,
} from "@/server/safety/turn-plan";

function plan(overrides: Partial<TurnPlan> = {}): TurnPlan {
  return {
    action: "research",
    understanding: "Te despidieron y quieres saber qué te corresponde.",
    reasoningSteps: [{ label: "Entendiendo tu situación" }],
    caseProfile: emptyCaseFacts,
    missingFacts: [],
    reply: null,
    quickReplies: [],
    searchQueries: ["despido arbitrario régimen privado general Perú"],
    riskFlags: [],
    ...overrides,
  };
}

function stubProvider(response: TurnPlan): LLMProvider {
  return {
    streamAnswer: () => Promise.reject(new Error("not used")),
    generateStructured: <T>(_input: LLMStructuredInput, schema: z.ZodSchema<T>) =>
      Promise.resolve(schema.parse(response)),
  };
}

function failingProvider(error: Error): LLMProvider {
  return {
    streamAnswer: () => Promise.reject(error),
    generateStructured: () => Promise.reject(error),
  };
}

describe("turn planner", () => {
  it("lets the deterministic classifier veto a planner that wants to answer", async () => {
    const classification = classifyQuery("Hubo un accidente grave y hay peligro inmediato en la obra");
    const result = await planTurn({
      llm: stubProvider(plan({ action: "converse", reply: "Todo bien, sigamos." })),
      conversation: [{ role: "user", content: "Hubo un accidente grave" }],
      caseProfile: emptyCaseProfile,
      classification,
      timeoutMs: 1_000,
    });

    expect(result.action).toBe("research");
    expect(result.reply).toBeNull();
    expect(result.riskFlags).toContain("emergency");
  });

  it("degrades to the deterministic plan when the planner call fails", async () => {
    const classification = classifyQuery("Me despidieron sin carta");
    const result = await planTurn({
      llm: failingProvider(new ProviderUnavailableError("upstream down", "llm")),
      conversation: [{ role: "user", content: "Me despidieron sin carta" }],
      caseProfile: emptyCaseProfile,
      classification,
      timeoutMs: 1_000,
    });

    expect(result.action).toBe(fallbackTurnPlan(classification, emptyCaseProfile).action);
  });

  it("propagates a rate limit instead of spending a retrieval round trip on it", async () => {
    const classification = classifyQuery("Me despidieron sin carta");

    await expect(
      planTurn({
        llm: failingProvider(new ProviderRateLimitError("limit reached", "llm", 15)),
        conversation: [{ role: "user", content: "Me despidieron sin carta" }],
        caseProfile: emptyCaseProfile,
        classification,
        timeoutMs: 1_000,
      }),
    ).rejects.toMatchObject({ code: "PROVIDER_RATE_LIMITED", retryAfterSeconds: 15 });
  });

  it("falls back to the deterministic plan when no provider is configured", async () => {
    const classification = classifyQuery("Me despidieron");
    const result = await planTurn({
      llm: null,
      conversation: [{ role: "user", content: "Me despidieron" }],
      caseProfile: emptyCaseProfile,
      classification,
      timeoutMs: 1_000,
    });

    expect(result).toEqual(applySafetyVeto(fallbackTurnPlan(classification), classification));
    expect(result.action).toBe("research");
  });

  it("falls back instead of failing when the planner call rejects", async () => {
    const classification = classifyQuery("Me despidieron");
    const failing: LLMProvider = {
      streamAnswer: () => Promise.reject(new Error("down")),
      generateStructured: () => Promise.reject(new Error("down")),
    };
    const result = await planTurn({
      llm: failing,
      conversation: [{ role: "user", content: "Me despidieron" }],
      caseProfile: emptyCaseProfile,
      classification,
      timeoutMs: 1_000,
    });

    expect(result.action).toBe("research");
    expect(result.searchQueries.length).toBeGreaterThan(0);
  });

  it("asks at most one question per turn", () => {
    const classification = classifyQuery("¿Me corresponde CTS?");
    const result = applySafetyVeto(
      plan({
        action: "ask",
        missingFacts: [
          { key: "legal_regime", question: "¿Sabes si tu empresa era MYPE?", whyItMatters: "Cambia los beneficios.", quickReplies: ["Sí", "No", "No sé"] },
          { key: "tenure", question: "¿Cuánto tiempo trabajaste ahí?", whyItMatters: "Cambia el cálculo.", quickReplies: [] },
        ],
      }),
      classification,
    );

    expect(result.missingFacts).toHaveLength(1);
    expect(clarificationFromPlan(result).action).toBe("clarify");
    expect(clarificationFromPlan(result).missingFacts).toEqual(["legal_regime"]);
  });

  it("carries the accumulated case profile into self-contained search queries", async () => {
    const previous: CaseFacts = {
      ...emptyCaseFacts,
      topic: "cts",
      regime: "mype",
      terminationDate: "marzo 2026",
    };
    const classification = classifyQuery("Régimen privado general");
    const result = await planTurn({
      llm: stubProvider(
        plan({
          caseProfile: previous,
          searchQueries: ["CTS trabajador MYPE cese marzo 2026 Perú"],
        }),
      ),
      conversation: [
        { role: "user", content: "¿Me corresponde CTS?" },
        { role: "assistant", content: "¿Sabes si tu empresa era MYPE?" },
        { role: "user", content: "Régimen privado general" },
      ],
      caseProfile: { ...previous, questionsAsked: 0 },
      classification,
      timeoutMs: 1_000,
    });

    expect(result.caseProfile.topic).toBe("cts");
    expect(result.searchQueries[0]).toContain("CTS");
    expect(result.searchQueries[0]).not.toBe("regimen privado general");
  });

  it("routes a chatty turn through the evidence gate when it slips into a legal claim", () => {
    const classification = classifyQuery("Me despidieron");
    const result = applySafetyVeto(
      plan({ action: "converse", reply: "Claro, el artículo 34 dice que te corresponde una indemnización." }),
      classification,
    );

    expect(containsLegalAssertion("te corresponde una indemnización")).toBe(true);
    expect(result.action).toBe("research");
    expect(result.reply).toBeNull();
  });

  it("stops asking after the consecutive-question cap and answers with what it has", () => {
    const classification = classifyQuery("¿Me corresponde CTS?");
    const asking = plan({
      action: "ask",
      missingFacts: [
        { key: "tenure", question: "¿Cuánto tiempo trabajaste ahí?", whyItMatters: "Cambia el cálculo.", quickReplies: [] },
      ],
      reply: "Necesito un dato más.",
    });

    expect(applySafetyVeto(asking, classification, 0).action).toBe("ask");
    expect(applySafetyVeto(asking, classification, 1).action).toBe("ask");
    expect(applySafetyVeto(asking, classification, MAX_CONSECUTIVE_QUESTIONS).action).toBe("research");
  });

  it("owns the question counter instead of trusting the model", () => {
    const classification = classifyQuery("¿Me corresponde CTS?");
    const asking = plan({
      action: "ask",
      missingFacts: [
        { key: "tenure", question: "¿Cuánto tiempo trabajaste ahí?", whyItMatters: "Cambia el cálculo.", quickReplies: [] },
      ],
      reply: "Necesito un dato más.",
    });

    expect(plannedCaseProfile(applySafetyVeto(asking, classification, 1)).questionsAsked).toBe(2);
    // Researching resets the streak so a new topic can still be clarified later.
    expect(plannedCaseProfile(applySafetyVeto(plan(), classification, 2)).questionsAsked).toBe(0);
  });

  it("keeps a harmless conversational turn conversational", () => {
    const classification = classifyQuery("hola");
    const result = applySafetyVeto(
      plan({ action: "converse", reply: "Hola, cuéntame qué pasó en tu trabajo." }),
      classification,
    );

    expect(result.action).toBe("converse");
    expect(clarificationFromPlan(result).action).toBe("continue");
  });
});
