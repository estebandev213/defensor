import { LegalAnswerSchema, type LegalAnswer } from "@/server/ai/schemas";
import type { LegalSource } from "@/db/types";
import type {
  CitationValidationResult,
  ValidatedCitation,
} from "@/server/safety/types";
import type { RetrievedChunk } from "@/server/rag/types";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function excerpt(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > 280 ? `${compact.slice(0, 277)}...` : compact;
}

function safeCitationFailure(reason: string, invalidCitationIds: string[]): CitationValidationResult {
  return {
    ok: false,
    answer: {
      answerType: "abstention",
      title: "No puedo verificar esta respuesta",
      summary:
        "La respuesta generada no pudo validarse contra las fuentes recuperadas. No la mostraré sin respaldo verificable.",
      sections: [],
      nextSteps: ["Intenta nuevamente o consulta una fuente oficial directamente."],
      warnings: ["Defensor no reemplaza la asesoría de un abogado."],
      citationIds: [],
      confidenceLabel: "insufficient_evidence",
    },
    errorCode: "CITATION_VALIDATION_FAILED",
    invalidCitationIds,
    reason,
  };
}

export function validateCitations(input: {
  answer: unknown;
  chunks: readonly RetrievedChunk[];
  sources: ReadonlyMap<string, LegalSource>;
}): CitationValidationResult {
  const parsed = LegalAnswerSchema.safeParse(input.answer);
  if (!parsed.success) return safeCitationFailure("invalid_structured_answer", []);

  const answer: LegalAnswer = parsed.data;
  const chunkById = new Map(input.chunks.map((chunk) => [chunk.id, chunk]));
  const invalidIds = new Set<string>();
  const referencedIds = new Set<string>();

  for (const citationId of answer.citationIds) {
    referencedIds.add(citationId);
    if (!chunkById.has(citationId)) invalidIds.add(citationId);
  }

  for (const section of answer.sections) {
    for (const citationId of section.citationIds) {
      referencedIds.add(citationId);
      if (!chunkById.has(citationId)) invalidIds.add(citationId);
    }
  }

  if (answer.answerType !== "answer") {
    if (referencedIds.size > 0) {
      return safeCitationFailure("non_answer_contains_citations", [...invalidIds]);
    }
    return { ok: true, answer: { ...answer, citationIds: [] }, citations: [] };
  }

  if (answer.sections.length === 0 || answer.sections.some((section) => section.citationIds.length === 0)) {
    return safeCitationFailure("uncited_legal_section", [...invalidIds]);
  }
  if (invalidIds.size > 0) {
    return safeCitationFailure("unknown_citation_id", [...invalidIds]);
  }

  const citations: ValidatedCitation[] = [];
  let index = 1;
  for (const id of referencedIds) {
    const chunk = chunkById.get(id);
    if (!chunk) continue;
    const source = input.sources.get(chunk.sourceId);
    if (!source || source.id !== chunk.sourceId) {
      return safeCitationFailure("source_not_found", [id]);
    }
    if (
      source.status !== "vigente" ||
      chunk.status !== "vigente" ||
      !source.officialUrl ||
      !chunk.officialUrl ||
      !isHttpUrl(source.officialUrl) ||
      !isHttpUrl(chunk.officialUrl) ||
      source.officialUrl !== chunk.officialUrl ||
      !source.officialPublisher ||
      !chunk.citationLabel ||
      !chunk.text
    ) {
      return safeCitationFailure("citation_metadata_invalid", [id]);
    }

    citations.push({
      id,
      index,
      citationLabel: chunk.citationLabel,
      normTitle: source.title,
      normNumber: source.normNumber,
      articleLabel: chunk.articleLabel,
      excerpt: excerpt(chunk.text),
      officialUrl: source.officialUrl,
      officialPublisher: source.officialPublisher,
      status: source.status,
    });
    index += 1;
  }

  const normalizedAnswer: LegalAnswer = {
    ...answer,
    citationIds: citations.map((citation) => citation.id),
    sections: answer.sections.map((section) => ({
      ...section,
      citationIds: [...new Set(section.citationIds)],
    })),
  };

  return { ok: true, answer: normalizedAnswer, citations };
}
