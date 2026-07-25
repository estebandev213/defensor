export interface HybridSearchInput {
  query: string;
  legalRegime?: string;
  topics?: string[];
  effectiveAt?: string;
  semanticLimit: number;
  lexicalLimit: number;
  finalLimit: number;
}

export interface RetrievedChunk {
  id: string;
  sourceId: string;
  text: string;
  articleLabel?: string;
  citationLabel: string;
  officialUrl: string;
  semanticScore?: number;
  lexicalScore?: number;
  fusionScore: number;
  rerankScore?: number;
  status: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  legalRegime: string[];
  topics: string[];
}

export type RetrievalChannel = "semantic" | "lexical";

export interface RankedRetrievedChunk {
  chunk: RetrievedChunk;
  rank: number;
  channel: RetrievalChannel;
}
