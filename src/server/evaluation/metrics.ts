export interface RetrievalMetricInput {
  expectedIds: readonly string[];
  retrievedIds: readonly string[];
}

export function recallAtK(input: RetrievalMetricInput, k: number): number | null {
  if (input.expectedIds.length === 0 || k <= 0) return null;
  const expected = new Set(input.expectedIds);
  const retrieved = new Set(input.retrievedIds.slice(0, k));
  return [...expected].filter((id) => retrieved.has(id)).length / expected.size;
}

export function reciprocalRank(input: RetrievalMetricInput): number | null {
  if (input.expectedIds.length === 0) return null;
  const expected = new Set(input.expectedIds);
  const rank = input.retrievedIds.findIndex((id) => expected.has(id));
  return rank === -1 ? 0 : 1 / (rank + 1);
}

export function hitRate(input: RetrievalMetricInput): number | null {
  if (input.expectedIds.length === 0) return null;
  return reciprocalRank(input) === 0 ? 0 : 1;
}

export interface AbstentionMetricInput {
  expected: readonly boolean[];
  predicted: readonly boolean[];
}

export function abstentionPrecision(input: AbstentionMetricInput): number | null {
  if (input.expected.length === 0 || input.expected.length !== input.predicted.length) return null;
  const predictedPositive = input.predicted.filter(Boolean).length;
  if (predictedPositive === 0) return null;
  const truePositive = input.predicted.reduce(
    (count, prediction, index) => count + (prediction && input.expected[index] ? 1 : 0),
    0,
  );
  return truePositive / predictedPositive;
}

export function abstentionRecall(input: AbstentionMetricInput): number | null {
  if (input.expected.length === 0 || input.expected.length !== input.predicted.length) return null;
  const expectedPositive = input.expected.filter(Boolean).length;
  if (expectedPositive === 0) return null;
  const truePositive = input.predicted.reduce(
    (count, prediction, index) => count + (prediction && input.expected[index] ? 1 : 0),
    0,
  );
  return truePositive / expectedPositive;
}

export function mean(values: readonly (number | null)[]): number | null {
  const measured = values.filter((value): value is number => value !== null);
  return measured.length === 0 ? null : measured.reduce((sum, value) => sum + value, 0) / measured.length;
}
