import {
  TurnPlanSchema,
  emptyCaseProfile,
  type CaseFacts,
  type CaseProfile,
  type QueryClassification,
  type TurnPlan,
} from "@/server/ai/schemas";
import { buildTurnPlannerPrompt } from "@/server/ai/prompts/turn-planner";
import { ProviderRateLimitError } from "@/server/ai/providers/types";
import type { LLMMessage, LLMProvider } from "@/server/ai/providers/types";
import { runClarificationGate } from "@/server/safety/clarification";
import type { ClarificationDecision } from "@/server/safety/types";
import { AbortError, withTimeout } from "@/server/security/timeout";

const GREETING_REPLY =
  "Hola, soy Defensor. Cuéntame qué está pasando en tu trabajo y te oriento sobre tus derechos con información verificable.";

const OUT_OF_SCOPE_STEPS = [{ label: "Revisando si el tema es laboral" }];

/** The deterministic classifier can veto the planner, never the other way around. */
export function isVetoed(classification: QueryClassification): boolean {
  return classification.intent === "emergency" || classification.intent === "out_of_scope";
}

function riskFlagsFor(classification: QueryClassification): TurnPlan["riskFlags"] {
  const flags: TurnPlan["riskFlags"] = [];
  if (classification.intent === "emergency") flags.push("emergency");
  if (classification.intent === "out_of_scope") flags.push("out_of_scope");
  if (classification.intent === "calculation_request") flags.push("calculation");
  if (classification.intent === "document_request") flags.push("document_request");
  return flags;
}

function mergeCaseFacts(previous: CaseProfile, classification: QueryClassification): CaseFacts {
  return {
    topic: classification.category === "general" ? previous.topic : classification.category,
    regime: previous.regime ?? classification.possibleRegimes[0] ?? null,
    terminationDate: previous.terminationDate,
    contractType: previous.contractType,
    tenure: previous.tenure,
    otherFacts: previous.otherFacts,
  };
}

/**
 * Mirrors the pre-planner behaviour so the chat keeps working — and keeps the same
 * safety decisions — when the LLM is unavailable or returns an unusable plan.
 */
export function fallbackTurnPlan(
  classification: QueryClassification,
  caseProfile: CaseProfile = emptyCaseProfile,
): TurnPlan {
  const profile = mergeCaseFacts(caseProfile, classification);
  const riskFlags = riskFlagsFor(classification);

  if (classification.intent === "general_conversation") {
    return {
      action: "converse",
      understanding: "Es un saludo, todavía no me contaste tu caso.",
      reasoningSteps: [{ label: "Leyendo tu mensaje" }],
      caseProfile: profile,
      missingFacts: [],
      reply: GREETING_REPLY,
      quickReplies: ["Me despidieron", "No me pagan bien", "Tengo otra duda"],
      searchQueries: classification.searchQueries,
      riskFlags,
    };
  }

  const clarification = runClarificationGate(classification);
  const missingFact = classification.missingFacts[0];
  if (clarification.action === "clarify" && missingFact) {
    return {
      action: "ask",
      understanding: "Entendí tu tema, pero me falta un dato para orientarte bien.",
      reasoningSteps: [
        { label: "Entendiendo tu situación" },
        { label: "Revisando qué dato me falta" },
      ],
      caseProfile: profile,
      missingFacts: [
        {
          key: missingFact.key,
          question: missingFact.question,
          whyItMatters: missingFact.reason,
          quickReplies: [],
        },
      ],
      reply: "Para orientarte bien necesito un dato más de tu caso.",
      quickReplies: [],
      searchQueries: classification.searchQueries,
      riskFlags,
    };
  }

  return {
    action: "research",
    understanding: "Voy a revisar las normas oficiales que aplican a tu caso.",
    reasoningSteps: isVetoed(classification)
      ? OUT_OF_SCOPE_STEPS
      : [
          { label: "Entendiendo tu situación" },
          { label: "Buscando en normas oficiales" },
          { label: "Verificando que cada afirmación tenga respaldo" },
        ],
    caseProfile: profile,
    missingFacts: [],
    reply: null,
    quickReplies: [],
    searchQueries: classification.searchQueries,
    riskFlags,
  };
}

const LEGAL_ASSERTION_PATTERNS = [
  /\bart(?:iculo|\.)\s*\d/,
  /\b(?:ley|decreto|d\.?s\.?|d\.?leg\.?)\s*n?\.?\s*\d/,
  /\b(?:la ley|la norma|el codigo|el reglamento)\s+(?:dice|establece|senala|indica|obliga|exige|permite|prohibe)/,
  /\b(?:te|le|me)\s+corresponde[nsr]?\b/,
  /\btienes derecho a\b/,
  /\bel plazo (?:es|de|legal)\b/,
  /\bdebe[n]? pagarte\b/,
];

const COMBINING_MARKS = /[̀-ͯ]/g;

function normalizeForGuard(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase();
}

/**
 * The planner is only allowed to talk, never to state the law. If its reply
 * slips into a legal assertion we drop it and route the turn through the
 * evidence gate instead of showing unverified text.
 */
export function containsLegalAssertion(text: string | null): boolean {
  if (!text) return false;
  const normalized = normalizeForGuard(text);
  return LEGAL_ASSERTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Nobody wants an interrogation: after this many questions in a row we answer with what we have. */
export const MAX_CONSECUTIVE_QUESTIONS = 2;

export interface PlannedTurn extends TurnPlan {
  /** Consecutive clarifying questions so far; owned by the server, never by the model. */
  questionsAsked: number;
}

/**
 * The planner may only narrow what happens next. A deterministic emergency or
 * out-of-scope signal always wins, only one question is asked per turn, and the
 * question counter is recomputed here so the model cannot reset it.
 */
export function applySafetyVeto(
  plan: TurnPlan,
  classification: QueryClassification,
  questionsAsked = 0,
): PlannedTurn {
  const riskFlags = [...new Set([...plan.riskFlags, ...riskFlagsFor(classification)])];
  const research = (base: TurnPlan, reasoningSteps = base.reasoningSteps): PlannedTurn => ({
    ...base,
    action: "research",
    reply: null,
    quickReplies: [],
    missingFacts: [],
    reasoningSteps,
    riskFlags,
    questionsAsked: 0,
  });

  if (isVetoed(classification)) {
    return {
      ...research(plan, OUT_OF_SCOPE_STEPS),
      understanding:
        classification.intent === "emergency"
          ? "Esto suena urgente y va más allá de una consulta laboral."
          : "Esto no parece ser un tema de derechos laborales.",
    };
  }
  if (plan.action === "research") return research(plan);
  if (plan.action === "ask" && plan.missingFacts.length === 0) return research(plan);
  if (plan.action === "ask" && questionsAsked >= MAX_CONSECUTIVE_QUESTIONS) return research(plan);

  const missingFacts = plan.action === "ask" ? plan.missingFacts.slice(0, 1) : [];
  if (containsLegalAssertion(plan.reply) || containsLegalAssertion(missingFacts[0]?.whyItMatters ?? null)) {
    return research(plan);
  }

  return {
    ...plan,
    missingFacts,
    riskFlags,
    questionsAsked: plan.action === "ask" ? questionsAsked + 1 : questionsAsked,
  };
}

/** The plan after the deterministic gates, carrying the server-owned counter. */
export function plannedCaseProfile(plan: PlannedTurn): CaseProfile {
  return { ...plan.caseProfile, questionsAsked: plan.questionsAsked };
}

/**
 * Someone who asked for a plainer explanation wants the same guidance said
 * differently, so the turn never comes back as another question.
 */
export function asResearchTurn(plan: PlannedTurn): PlannedTurn {
  if (plan.action === "research") return plan;
  return { ...plan, action: "research", reply: null, quickReplies: [], missingFacts: [], questionsAsked: 0 };
}

export function clarificationFromPlan(plan: TurnPlan): ClarificationDecision {
  const missingFact = plan.action === "ask" ? plan.missingFacts[0] : undefined;
  if (!missingFact) {
    return { action: "continue", reasonCode: "no_missing_fact", missingFacts: [] };
  }
  return {
    action: "clarify",
    reasonCode: "missing_material_fact",
    missingFacts: [missingFact.key],
    question: missingFact.question,
  };
}

/**
 * Deterministic topic queries are the stable retrieval baseline. Planner
 * queries can add useful case detail, but must not replace that baseline with
 * conversational fragments that happen to produce weak semantic matches.
 */
export function prioritizedSearchQueries(
  plan: TurnPlan,
  classification: QueryClassification,
): string[] {
  return [...new Set([
    ...classification.searchQueries,
    ...plan.searchQueries,
  ])].slice(0, 4);
}

export async function planTurn(input: {
  llm: LLMProvider | null;
  conversation: readonly LLMMessage[];
  caseProfile: CaseProfile;
  classification: QueryClassification;
  timeoutMs: number;
  signal?: AbortSignal;
}): Promise<PlannedTurn> {
  const fallback = fallbackTurnPlan(input.classification, input.caseProfile);
  const questionsAsked = input.caseProfile.questionsAsked;
  if (!input.llm || isVetoed(input.classification)) {
    return applySafetyVeto(fallback, input.classification, questionsAsked);
  }

  try {
    const plan = await withTimeout(
      input.llm.generateStructured(
        buildTurnPlannerPrompt({
          conversation: input.conversation,
          caseProfile: input.caseProfile,
          classification: input.classification,
        }),
        TurnPlanSchema,
      ),
      input.timeoutMs,
      input.signal,
    );
    return applySafetyVeto(plan, input.classification, questionsAsked);
  } catch (error) {
    if (error instanceof AbortError) throw error;
    // A rate limit is not a planner outage to degrade around: the answer call
    // shares the same quota, so continuing would spend a retrieval round trip
    // and an embedding call only to fail on the next request anyway.
    if (error instanceof ProviderRateLimitError) throw error;
    return applySafetyVeto(fallback, input.classification, questionsAsked);
  }
}
