import path from "node:path";
import { writeClaimSupportArtifacts } from "@/server/evaluation/claim-support";

const inputPath = path.resolve(process.cwd(), "data/evaluation/claim-support.json");
const outputDirectory = path.resolve(process.cwd(), "artifacts/evals");

async function main() {
  const report = await writeClaimSupportArtifacts({ inputPath, outputDirectory });
  console.log(`Claim-support report: ${report.status}`);
  console.log(`Cases: ${report.passed}/${report.total}`);
  console.log(`Artifacts: ${outputDirectory}`);
  process.exitCode = report.gates.ready ? 0 : 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Claim-support evaluation failed");
  process.exitCode = 1;
});
