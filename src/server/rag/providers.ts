export interface EmbeddingProvider {
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

export interface Reranker {
  rerank(query: string, documents: import("@/server/rag/types").RetrievedChunk[], limit: number): Promise<import("@/server/rag/types").RetrievedChunk[]>;
}

export function validateEmbedding(vector: readonly number[], expectedDimensions = 1536): number[] {
  if (vector.length !== expectedDimensions) {
    throw new Error(`Embedding dimension mismatch: expected ${expectedDimensions}, received ${vector.length}.`);
  }
  if (vector.some((value) => !Number.isFinite(value))) {
    throw new Error("Embedding contains a non-finite value.");
  }
  return [...vector];
}
