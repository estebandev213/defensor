import { LegalAnswerSchema, type LegalAnswer } from "@/server/ai/schemas";
import type { LegalSource } from "@/db/types";
import type {
  CitationValidationResult,
  ValidatedCitation,
} from "@/server/safety/types";
import type { RetrievedChunk } from "@/server/rag/types";
import { validateLegalBlockSupport } from "@/server/safety/claim-support";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isUsableStatus(status: string): boolean {
  return status === "vigente" || status === "modificada";
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
      reply: [
        {
          text: "Preparé una respuesta, pero no pude comprobar que cada parte estuviera respaldada por las fuentes oficiales. Prefiero no darte algo que no puedo sustentar. ¿Lo intentamos otra vez, quizá contándome un poco más de tu caso?",
          isLegalClaim: false,
          citationIds: [],
        },
      ],
      followUpQuestion: null,
      quickReplies: ["Intentar otra vez"],
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

  for (const block of answer.reply) {
    for (const citationId of block.citationIds) {
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

  // Conversational blocks carry no legal claim and need no citation, but every
  // block that states what the law says must be backed, and an answer must
  // contain at least one such block.
  const legalClaims = answer.reply.filter((block) => block.isLegalClaim);
  if (legalClaims.length === 0 || legalClaims.some((block) => block.citationIds.length === 0)) {
    return safeCitationFailure("uncited_legal_claim", [...invalidIds]);
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
      !isUsableStatus(source.status) ||
      !isUsableStatus(chunk.status) ||
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

  const unsupportedClaims = legalClaims.filter(
    (block) => !validateLegalBlockSupport(block, chunkById).supported,
  );
  if (unsupportedClaims.length > 0) {
    return safeCitationFailure(
      "claim_not_supported_by_cited_passage",
      [...new Set(unsupportedClaims.flatMap((block) => block.citationIds))],
    );
  }

  const normalizedAnswer: LegalAnswer = {
    ...answer,
    citationIds: citations.map((citation) => citation.id),
    reply: answer.reply.map((block) => ({
      ...block,
      citationIds: [...new Set(block.citationIds)],
    })),
  };

  return { ok: true, answer: normalizedAnswer, citations };
}
