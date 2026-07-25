import type { RetrievedChunk } from "@/server/rag/types";

function normalizeKey(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function deduplicateChunks(chunks: readonly RetrievedChunk[]): RetrievedChunk[] {
  const unique = new Map<string, RetrievedChunk>();
  for (const chunk of chunks) {
    const articleKey = chunk.articleLabel ? normalizeKey(chunk.articleLabel) : "";
    const key = `${chunk.sourceId}:${articleKey}:${normalizeKey(chunk.text)}`;
    const current = unique.get(key);
    if (!current || chunk.fusionScore > current.fusionScore) unique.set(key, chunk);
  }
  return [...unique.values()].sort((left, right) => right.fusionScore - left.fusionScore);
}

export function diversifyChunks(chunks: readonly RetrievedChunk[], limit: number): RetrievedChunk[] {
  if (!Number.isInteger(limit) || limit < 1) throw new Error("Diversity limit must be a positive integer.");
  const remaining = [...chunks];
  const selected: RetrievedChunk[] = [];

  while (remaining.length > 0 && selected.length < limit) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index];
      const sourceAlreadyUsed = selected.some((chunk) => chunk.sourceId === candidate.sourceId);
      const topicsAlreadyUsed = candidate.topics.filter((topic) => selected.some((chunk) => chunk.topics.includes(topic))).length;
      const score = candidate.fusionScore + (sourceAlreadyUsed ? 0 : 0.01) + (candidate.topics.length - topicsAlreadyUsed) * 0.001;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
    const [best] = remaining.splice(bestIndex, 1);
    selected.push(best);
  }

  return selected;
}
