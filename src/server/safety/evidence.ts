import type { LegalAnswer, QueryClassification } from "@/server/ai/schemas";
import type { RetrievedChunk } from "@/server/rag/types";
import type {
  EvidenceDecision,
  EvidenceGateInput,
} from "@/server/safety/types";

const DEFAULT_MIN_FUSION_SCORE = 1 / 120;

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
  options: { minFusionScore?: number; finalLimit?: number } = {},
): EvidenceDecision {
  const { classification, clarification } = input;

  if (classification.intent === "out_of_scope" || classification.intent === "emergency") {
    return abstain("out_of_scope");
  }

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
  const eligible = input.chunks.filter(
    (chunk) =>
      chunk.fusionScore >= minFusionScore &&
      isUsableStatus(chunk.status) &&
      isHttpUrl(chunk.officialUrl),
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
export function createSafeAbstention(
  decision: EvidenceDecision,
): LegalAnswer {
  const messageByReason: Record<EvidenceDecision["reasonCode"], string> = {
    sufficient_evidence: "La evidencia recuperada permite preparar una respuesta con citas.",
    missing_material_fact:
      "Necesito un dato importante de tu caso antes de responder con seguridad.",
    low_retrieval_confidence:
      "No encontré evidencia legal oficial suficiente para responder con seguridad.",
    conflicting_sources:
      "Encontré fuentes que requieren una revisión de vigencia o contexto antes de responder.",
    unsupported_regime:
      "El régimen laboral de tu consulta no está cubierto de forma suficiente por el corpus actual.",
    outdated_or_unknown_status:
      "Las fuentes encontradas no tienen un estado de vigencia suficientemente claro.",
    out_of_scope:
      "Esta consulta está fuera del alcance de orientación laboral peruana de Defensor.",
  };

  return {
    answerType: decision.action === "clarify" ? "clarification" : "abstention",
    title: decision.action === "clarify" ? "Necesito un dato más" : "No puedo responder con seguridad",
    summary: messageByReason[decision.reasonCode],
    sections: [],
    nextSteps:
      decision.action === "clarify" && decision.missingFacts?.[0]
        ? [`Aclara este dato: ${decision.missingFacts[0]}.`]
        : ["Revisa las fuentes oficiales o consulta a SUNAFIL, MTPE o un profesional."] ,
    warnings: ["Defensor no reemplaza la asesoría de un abogado."],
    citationIds: [],
    confidenceLabel:
      decision.action === "clarify"
        ? "needs_more_information"
        : "insufficient_evidence",
  };
}

export function createClarificationAnswer(
  classification: QueryClassification,
): LegalAnswer {
  const missingFact = classification.missingFacts[0];
  const decision: EvidenceDecision = {
    action: "clarify",
    reasonCode: "missing_material_fact",
    supportingChunkIds: [],
    missingFacts: missingFact ? [missingFact.key] : [],
  };
  const answer = createSafeAbstention(decision);
  return {
    ...answer,
    summary: missingFact?.question ?? answer.summary,
    nextSteps: [],
  };
}
