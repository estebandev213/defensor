export type LegalSourceStatus = "vigente" | "modificada" | "derogada" | "desconocida";

export interface LegalSource {
  id: string;
  title: string;
  normType: string;
  normNumber?: string;
  officialPublisher: string;
  officialUrl: string;
  sourceDomain: string;
  publicationDate?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: LegalSourceStatus;
  retrievedAt: string;
  contentHash: string;
  metadata: Record<string, unknown>;
}

export interface LegalDocument {
  id: string;
  sourceId: string;
  version: string;
  rawText: string;
  normalizedText: string;
  language: string;
  legalRegime: string[];
  topics: string[];
  parserVersion: string;
  createdAt: string;
}

export interface LegalChunk {
  id: string;
  documentId: string;
  sourceId: string;
  chunkIndex: number;
  articleLabel?: string;
  articleNumber?: string;
  subsection?: string;
  headingPath: string[];
  exactText: string;
  normalizedText: string;
  citationLabel: string;
  anchor?: string;
  legalRegime: string[];
  topics: string[];
  effectiveFrom?: string;
  effectiveTo?: string;
  status: LegalSourceStatus;
  tokenCount?: number;
  metadata: Record<string, unknown>;
}

export interface FeedbackEvent {
  id: string;
  sessionIdHash: string;
  answerId: string;
  rating: "helpful" | "not_helpful";
  reasonCode?: string;
  safeComment?: string;
  createdAt: string;
}
