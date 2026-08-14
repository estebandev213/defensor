import type { LegalAnswer, TurnPlan } from "@/server/ai/schemas";
import type { RetrievedChunk } from "@/server/rag/types";
import type {
  EvidenceDecision,
  EvidenceGateInput,
} from "@/server/safety/types";

const DEFAULT_MIN_FUSION_SCORE = 1 / 70;
const DEFAULT_MIN_SEMANTIC_SCORE = 0.55;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizedConflictText(chunk: RetrievedChunk): string {
  return chunk.text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function hasConflictingSources(chunks: readonly RetrievedChunk[]): boolean {
  const byArticle = new Map<string, Map<string, Set<string>>>();

  for (const chunk of chunks) {
    const articleKey = chunk.articleLabel ?? chunk.citationLabel;
    const bySource = byArticle.get(articleKey) ?? new Map<string, Set<string>>();
    const texts = bySource.get(chunk.sourceId) ?? new Set<string>();
    texts.add(normalizedConflictText(chunk));
    bySource.set(chunk.sourceId, texts);
    byArticle.set(articleKey, bySource);
  }

  for (const bySource of byArticle.values()) {
    const sourceTexts = [...bySource.values()].map((texts) => [...texts].join("\n"));
    if (new Set(sourceTexts).size > 1 && bySource.size > 1) return true;
  }

  return false;
}

function isUsableStatus(status: RetrievedChunk["status"]): boolean {
  return status === "vigente" || status === "modificada";
}

function abstain(
  reasonCode: Exclude<EvidenceDecision["reasonCode"], "sufficient_evidence" | "missing_material_fact">,
): EvidenceDecision {
  return { action: "abstain", reasonCode, supportingChunkIds: [] };
}

export function evaluateEvidence(
  input: EvidenceGateInput,
  options: { minFusionScore?: number; minSemanticScore?: number; finalLimit?: number } = {},
): EvidenceDecision {
  const { classification, clarification } = input;

  if (classification.intent === "emergency") return abstain("emergency");
  if (classification.intent === "out_of_scope") return abstain("out_of_scope");

  if (classification.coverageStatus === "unsupported") {
    return abstain(
      classification.intent === "legal_question"
        ? "unsupported_regime"
        : "out_of_scope",
    );
  }

  if (clarification?.action === "clarify") {
    return {
      action: "clarify",
      reasonCode: "missing_material_fact",
      supportingChunkIds: [],
      missingFacts: clarification.missingFacts,
    };
  }

  const minFusionScore = options.minFusionScore ?? DEFAULT_MIN_FUSION_SCORE;
  const minSemanticScore = options.minSemanticScore ?? DEFAULT_MIN_SEMANTIC_SCORE;
  const expectedTopics = classification.category === "general" ? [] : [classification.category];
  const expectedRegimes = classification.possibleRegimes;
  const eligible = input.chunks.filter(
    (chunk) =>
      chunk.fusionScore >= minFusionScore &&
      isUsableStatus(chunk.status) &&
      isHttpUrl(chunk.officialUrl) &&
      (expectedTopics.length === 0 || expectedTopics.some((topic) => chunk.topics.includes(topic))) &&
      (expectedRegimes.length === 0 || expectedRegimes.some((regime) => chunk.legalRegime.includes(regime))) &&
      ((chunk.lexicalScore ?? 0) > 0 ||
        (chunk.semanticScore ?? -1) >= minSemanticScore ||
        (chunk.lexicalScore !== undefined && chunk.semanticScore !== undefined)),
  );

  if (input.chunks.some((chunk) => !isUsableStatus(chunk.status)) && eligible.length === 0) {
    return abstain("outdated_or_unknown_status");
  }

  if (eligible.length === 0) return abstain("low_retrieval_confidence");
  if (hasConflictingSources(eligible)) return abstain("conflicting_sources");

  return {
    action: "answer",
    reasonCode: "sufficient_evidence",
    supportingChunkIds: eligible
      .slice(0, options.finalLimit ?? 5)
      .map((chunk) => chunk.id),
  };
}
function conversationalBlock(text: string): LegalAnswer["reply"] {
  return [{ text, isLegalClaim: false, citationIds: [] }];
}

export function createSafeAbstention(decision: EvidenceDecision): LegalAnswer {
  const messageByReason: Record<EvidenceDecision["reasonCode"], string> = {
    sufficient_evidence:
      "Encontré normas oficiales que respaldan una respuesta para tu caso.",
    missing_material_fact:
      "Necesito un dato más de tu caso antes de darte una orientación en la que puedas confiar.",
    low_retrieval_confidence:
      "Busqué en las normas oficiales pero no encontré nada suficientemente claro para responderte con respaldo. Prefiero decírtelo antes que darte algo que quizá no aplique a tu caso. Si me cuentas un poco más de tu situación, lo intento de nuevo.",
    conflicting_sources:
      "Encontré normas que se contradicen o que podrían haber cambiado, y no quiero orientarte con información que no puedo confirmar. Te conviene revisarlo con SUNAFIL o con un abogado.",
    unsupported_regime:
      "Tu caso parece estar en un régimen laboral que todavía no cubro bien, así que no quiero arriesgarme a orientarte mal. SUNAFIL o el MTPE pueden ayudarte con esto.",
    outdated_or_unknown_status:
      "Las normas que encontré no tienen una vigencia clara y no quiero apoyarme en algo que podría estar derogado. Vale la pena confirmarlo con una fuente oficial.",
    out_of_scope:
      "Eso se sale de lo que puedo ver: solo oriento sobre derechos laborales en Perú. Si tienes alguna duda sobre tu trabajo, con gusto la vemos.",
    emergency:
      "Antes que nada: si estás en peligro o alguien salió herido, llama al 105 o al 106 ahora mismo. Cuando estés a salvo, puedes reportar lo ocurrido a SUNAFIL, y aquí vemos juntos qué derechos laborales te amparan.",
  };

  const isClarification = decision.action === "clarify";

  return {
    answerType: isClarification ? "clarification" : "abstention",
    reply: conversationalBlock(messageByReason[decision.reasonCode]),
    followUpQuestion: null,
    quickReplies: isClarification ? [] : ["Contarte más de mi caso"],
    citationIds: [],
    confidenceLabel: isClarification ? "needs_more_information" : "insufficient_evidence",
  };
}

/** Warm, non-legal reply used when the planner decides to just talk. */
export function createConversationalAnswer(plan: TurnPlan): LegalAnswer {
  return {
    answerType: "clarification",
    reply: conversationalBlock(plan.reply ?? "Cuéntame qué está pasando en tu trabajo."),
    followUpQuestion: null,
    quickReplies: plan.quickReplies,
    citationIds: [],
    confidenceLabel: "needs_more_information",
  };
}

/** Asks the single missing fact the planner selected, keeping the tone conversational. */
export function createClarificationAnswer(plan: TurnPlan): LegalAnswer {
  const missingFact = plan.missingFacts[0];
  if (!missingFact) return createConversationalAnswer(plan);

  return {
    answerType: "clarification",
    reply: plan.reply ? conversationalBlock(plan.reply) : conversationalBlock(missingFact.whyItMatters),
    followUpQuestion: missingFact.question,
    quickReplies: missingFact.quickReplies.length > 0 ? missingFact.quickReplies : plan.quickReplies,
    citationIds: [],
    confidenceLabel: "needs_more_information",
  };
}
