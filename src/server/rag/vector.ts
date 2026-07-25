export function toPgVectorLiteral(vector: readonly number[]): string {
  if (vector.length === 0) throw new Error("Embedding cannot be empty.");
  if (vector.some((value) => !Number.isFinite(value))) {
    throw new Error("Embedding contains a non-finite value.");
  }
  return `[${vector.join(",")}]`;
}
