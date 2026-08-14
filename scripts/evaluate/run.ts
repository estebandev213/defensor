import path from "node:path";
import { getEvaluationExitCode, writeEvaluationArtifacts } from "@/server/evaluation/runner";

const inputPath = path.resolve(process.cwd(), "data/evaluation/golden.json");
const outputDirectory = path.resolve(process.cwd(), "artifacts/evals");

async function main() {
  const report = await writeEvaluationArtifacts({ inputPath, outputDirectory });

  console.log(`Evaluation report: ${report.status}`);
  console.log(`Cases: ${report.dataset.total}`);
  console.log(`Artifacts: ${outputDirectory}`);
  process.exitCode = getEvaluationExitCode(report);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Evaluation failed");
  process.exitCode = 1;
});
