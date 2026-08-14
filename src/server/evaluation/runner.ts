import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { EvaluationDatasetSchema, type EvaluationCase } from "@/server/evaluation/schema";

export interface EvaluationMetricStatus {
  status: "not_run" | "measured";
  value: number | null;
  reason?: string;
}

export interface EvaluationReport {
  reportVersion: 1;
  generatedAt: string;
  status: "blocked_no_corpus" | "measured";
  dataset: {
    total: number;
    abstentionExpected: number;
    categoryCounts: Record<string, number>;
  };
  retrieval: Record<string, Record<string, EvaluationMetricStatus>>;
  generation: Record<string, EvaluationMetricStatus>;
  product: Record<string, EvaluationMetricStatus>;
  gates: {
    ready: boolean;
    reasons: string[];
  };
}

export function getEvaluationExitCode(
  report: Pick<EvaluationReport, "status" | "gates">,
): 0 | 1 {
  return report.status === "measured" && report.gates.ready ? 0 : 1;
}

function categoryCounts(cases: readonly EvaluationCase[]): Record<string, number> {
  return cases.reduce<Record<string, number>>((counts, evaluationCase) => {
    counts[evaluationCase.category] = (counts[evaluationCase.category] ?? 0) + 1;
    return counts;
  }, {});
}

function notRun(reason: string): EvaluationMetricStatus {
  return { status: "not_run", value: null, reason };
}

export function buildBlockedReport(cases: readonly EvaluationCase[], generatedAt = new Date().toISOString()): EvaluationReport {
  const reason = "No hay corpus legal poblado ni predicciones conectadas; no se calculan métricas.";
  const retrievalModes = ["vector_only", "lexical_only", "hybrid", "hybrid_reranking"];
  const retrieval: EvaluationReport["retrieval"] = {};
  for (const mode of retrievalModes) {
    retrieval[mode] = {
      recallAt5: notRun(reason),
      recallAt10: notRun(reason),
      mrr: notRun(reason),
      hitRate: notRun(reason),
    };
  }

  return {
    reportVersion: 1,
    generatedAt,
    status: "blocked_no_corpus",
    dataset: {
      total: cases.length,
      abstentionExpected: cases.filter((evaluationCase) => evaluationCase.shouldAbstain).length,
      categoryCounts: categoryCounts(cases),
    },
    retrieval,
    generation: {
      citationValidity: notRun(reason),
      citationCompleteness: notRun(reason),
      faithfulness: notRun(reason),
      answerPointCoverage: notRun(reason),
      unsupportedClaimRate: notRun(reason),
      abstentionPrecision: notRun(reason),
      abstentionRecall: notRun(reason),
      clarificationAppropriateness: notRun(reason),
    },
    product: {
      timeToFirstToken: notRun(reason),
      p50Latency: notRun(reason),
      p95Latency: notRun(reason),
      errorRate: notRun(reason),
      helpfulRate: notRun(reason),
    },
    gates: {
      ready: false,
      reasons: [
        "Populate and validate the official legal corpus before measuring retrieval.",
        "Connect deterministic predictions or a test provider before measuring generated answers.",
      ],
    },
  };
}

function formatMetric(metric: EvaluationMetricStatus): string {
  if (metric.value === null) return `no ejecutado (${metric.reason ?? "sin datos"})`;
  return metric.value.toFixed(4);
}

export function renderEvaluationMarkdown(report: EvaluationReport): string {
  const lines = [
    "# Defensor evaluation report",
    "",
    `- Estado: **${report.status}**`,
    `- Generado: ${report.generatedAt}`,
    `- Casos: ${report.dataset.total}`,
    `- Casos que esperan abstención: ${report.dataset.abstentionExpected}`,
    "",
    "## Cobertura del dataset",
    "",
    ...Object.entries(report.dataset.categoryCounts).map(([category, count]) => `- ${category}: ${count}`),
    "",
    "## Retrieval",
    "",
    ...Object.entries(report.retrieval).flatMap(([mode, metrics]) => [
      `### ${mode}`,
      ...Object.entries(metrics).map(([metric, value]) => `- ${metric}: ${formatMetric(value)}`),
      "",
    ]),
    "## Generación y producto",
    "",
    ...Object.entries({ ...report.generation, ...report.product }).map(([metric, value]) => `- ${metric}: ${formatMetric(value)}`),
    "",
    "## Gates",
    "",
    `- Listo para declarar production-ready: **${report.gates.ready ? "sí" : "no"}**`,
    ...report.gates.reasons.map((reason) => `- Bloqueo: ${reason}`),
    "",
    "Este archivo es un reporte de estado del harness. Los valores no ejecutados permanecen nulos para evitar inventar resultados.",
    "",
  ];
  return lines.join("\n");
}

export async function loadEvaluationCases(filePath: string): Promise<EvaluationCase[]> {
  const raw = await readFile(filePath, "utf8");
  const parsed = EvaluationDatasetSchema.safeParse(JSON.parse(raw) as unknown);
  if (!parsed.success) throw new Error(`Evaluation dataset is invalid: ${parsed.error.message}`);
  return parsed.data;
}

export async function writeEvaluationArtifacts(options: { inputPath: string; outputDirectory: string }): Promise<EvaluationReport> {
  const cases = await loadEvaluationCases(options.inputPath);
  const report = buildBlockedReport(cases);
  await mkdir(options.outputDirectory, { recursive: true });
  await writeFile(path.join(options.outputDirectory, "latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(path.join(options.outputDirectory, "latest.md"), renderEvaluationMarkdown(report), "utf8");
  return report;
}
