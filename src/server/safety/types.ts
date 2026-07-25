import type { LegalAnswer, QueryClassification } from "@/server/ai/schemas";
import type { RetrievedChunk } from "@/server/rag/types";

export interface ClarificationDecision {
  action: "continue" | "clarify";
  reasonCode: "missing_material_fact" | "no_missing_fact";
  missingFacts: string[];
  question?: string;
}

export interface EvidenceDecision {
  action: "answer" | "clarify" | "abstain";
  reasonCode:
    | "sufficient_evidence"
    | "missing_material_fact"
    | "low_retrieval_confidence"
    | "conflicting_sources"
    | "unsupported_regime"
    | "outdated_or_unknown_status"
    | "out_of_scope";
  supportingChunkIds: string[];
  missingFacts?: string[];
}

export interface EvidenceGateInput {
  classification: QueryClassification;
  chunks: readonly RetrievedChunk[];
  clarification?: ClarificationDecision;
}

export interface ValidatedCitation {
  id: string;
  index: number;
  citationLabel: string;
  normTitle: string;
  normNumber?: string;
  articleLabel?: string;
  excerpt: string;
  officialUrl: string;
  officialPublisher: string;
  status: string;
}

export interface CitationValidationSuccess {
  ok: true;
  answer: LegalAnswer;
  citations: ValidatedCitation[];
}

export interface CitationValidationFailure {
  ok: false;
  answer: LegalAnswer;
  errorCode: "CITATION_VALIDATION_FAILED";
  invalidCitationIds: string[];
  reason: string;
}

export type CitationValidationResult =
  | CitationValidationSuccess
  | CitationValidationFailure;
