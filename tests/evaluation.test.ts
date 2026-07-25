import { describe, expect, it } from "vitest";
import goldenCases from "../data/evaluation/golden.json";
import { EvaluationDatasetSchema } from "@/server/evaluation/schema";
import { abstentionPrecision, abstentionRecall, hitRate, mean, recallAtK, reciprocalRank } from "@/server/evaluation/metrics";
import { buildBlockedReport } from "@/server/evaluation/runner";

describe("golden evaluation dataset", () => {
  it("matches the required 80-case distribution", () => {
    const cases = EvaluationDatasetSchema.parse(goldenCases);
    const counts = cases.reduce<Record<string, number>>((result, evaluationCase) => {
      result[evaluationCase.category] = (result[evaluationCase.category] ?? 0) + 1;
      return result;
    }, {});

    expect(cases).toHaveLength(80);
    expect(counts).toEqual({
      despido: 15,
      cts: 12,
      gratificaciones: 12,
      vacaciones: 10,
      horas_extras: 8,
      contratos: 8,
      mype: 8,
      out_of_scope: 7,
    });
    expect(cases.every((evaluationCase) => evaluationCase.shouldAbstain)).toBe(true);
  });
});

describe("evaluation metrics", () => {
  it("computes retrieval metrics without treating empty expectations as a hit", () => {
    const input = { expectedIds: ["a", "b"], retrievedIds: ["x", "b", "a"] };

    expect(recallAtK(input, 1)).toBe(0);
    expect(recallAtK(input, 3)).toBe(1);
    expect(reciprocalRank(input)).toBeCloseTo(1 / 2);
    expect(hitRate(input)).toBe(1);
    expect(recallAtK({ expectedIds: [], retrievedIds: ["a"] }, 5)).toBeNull();
  });

  it("computes abstention precision and recall", () => {
    const input = { expected: [true, true, false, false], predicted: [true, false, false, true] };

    expect(abstentionPrecision(input)).toBeCloseTo(0.5);
    expect(abstentionRecall(input)).toBeCloseTo(0.5);
    expect(mean([1, null, 0.5])).toBeCloseTo(0.75);
  });
});

describe("evaluation report", () => {
  it("keeps blocked metrics null while the corpus is empty", () => {
    const report = buildBlockedReport(EvaluationDatasetSchema.parse(goldenCases));

    expect(report.status).toBe("blocked_no_corpus");
    expect(report.gates.ready).toBe(false);
    expect(report.retrieval.hybrid.recallAt5.value).toBeNull();
    expect(report.generation.citationValidity.value).toBeNull();
  });
});
