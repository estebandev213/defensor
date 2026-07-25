import type { RankedRetrievedChunk, RetrievedChunk } from "@/server/rag/types";

interface FusionAccumulator {
  chunk: RetrievedChunk;
  semanticScore?: number;
  lexicalScore?: number;
  fusionScore: number;
}

export function reciprocalRank(rank: number, k = 60): number {
  if (!Number.isInteger(rank) || rank < 1) throw new Error("RRF rank must be a positive integer.");
  if (!Number.isFinite(k) || k <= 0) throw new Error("RRF k must be positive.");
  return 1 / (k + rank);
}

export function fuseRankedResults(
  semanticResults: readonly RankedRetrievedChunk[],
  lexicalResults: readonly RankedRetrievedChunk[],
  limit: number,
  k = 60,
): RetrievedChunk[] {
  if (!Number.isInteger(limit) || limit < 1) throw new Error("RRF limit must be a positive integer.");
  const results = new Map<string, FusionAccumulator>();

  for (const result of [...semanticResults, ...lexicalResults]) {
    const current = results.get(result.chunk.id);
    const score = result.chunk.semanticScore ?? result.chunk.lexicalScore;
    const next: FusionAccumulator = current ?? {
      chunk: result.chunk,
      fusionScore: 0,
    };
    next.fusionScore += reciprocalRank(result.rank, k);
    if (result.channel === "semantic") next.semanticScore = score;
    if (result.channel === "lexical") next.lexicalScore = score;
    results.set(result.chunk.id, next);
  }

  return [...results.values()]
    .sort((left, right) => right.fusionScore - left.fusionScore || left.chunk.id.localeCompare(right.chunk.id))
    .slice(0, limit)
    .map(({ chunk, semanticScore, lexicalScore, fusionScore }) => ({
      ...chunk,
      semanticScore,
      lexicalScore,
      fusionScore,
    }));
}
