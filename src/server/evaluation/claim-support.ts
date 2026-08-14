import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { evaluateClaimSupport } from "@/server/safety/claim-support";

export const ClaimSupportCaseSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["supported", "irrelevant", "unsupported_anchor", "adversarial", "insufficient"]),
  claim: z.string().min(1),
  evidence: z.string().min(1),
  shouldPass: z.boolean(),
});

export const ClaimSupportDatasetSchema = z.array(ClaimSupportCaseSchema).min(5);
export type ClaimSupportCase = z.infer<typeof ClaimSupportCaseSchema>;

export interface ClaimSupportEvaluationReport {
  reportVersion: 1;
  generatedAt: string;
  status: "measured";
  total: number;
  passed: number;
  failed: number;
  accuracy: number;
  cases: Array<{
    id: string;
    kind: ClaimSupportCase["kind"];
    expected: boolean;
    actual: boolean;
    passed: boolean;
    coverage: number;
    missingAnchors: string[];
  }>;
  gates: { ready: boolean; reasons: string[] };
}

export async function loadClaimSupportCases(filePath: string): Promise<ClaimSupportCase[]> {
  const raw = await readFile(filePath, "utf8");
  return ClaimSupportDatasetSchema.parse(JSON.parse(raw) as unknown);
}

export function evaluateClaimSupportCases(
  cases: readonly ClaimSupportCase[],
  generatedAt = new Date().toISOString(),
): ClaimSupportEvaluationReport {
  const results = cases.map((evaluationCase) => {
    const result = evaluateClaimSupport(evaluationCase.claim, evaluationCase.evidence);
    return {
      id: evaluationCase.id,
      kind: evaluationCase.kind,
      expected: evaluationCase.shouldPass,
      actual: result.supported,
      passed: result.supported === evaluationCase.shouldPass,
      coverage: result.coverage,
      missingAnchors: result.missingAnchors,
    };
  });
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  return {
    reportVersion: 1,
    generatedAt,
    status: "measured",
    total: results.length,
    passed,
    failed,
    accuracy: results.length === 0 ? 0 : passed / results.length,
    cases: results,
    gates: {
      ready: failed === 0,
      reasons: failed === 0 ? [] : results.filter((result) => !result.passed).map((result) => result.id),
    },
  };
}

export async function writeClaimSupportArtifacts(options: {
  inputPath: string;
  outputDirectory: string;
}): Promise<ClaimSupportEvaluationReport> {
  const cases = await loadClaimSupportCases(options.inputPath);
  const report = evaluateClaimSupportCases(cases);
  await mkdir(options.outputDirectory, { recursive: true });
  await writeFile(
    path.join(options.outputDirectory, "claim-support-latest.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  return report;
}
