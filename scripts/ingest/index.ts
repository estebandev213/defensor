import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateCorpus } from "@/server/legal/corpus-schema";

interface IngestionReport {
  generatedAt: string;
  inputPath: string;
  dryRun: boolean;
  validation: ReturnType<typeof validateCorpus>;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main(): Promise<void> {
  const inputPath = resolve(process.cwd(), "data/legal/corpus.seed.json");
  const outputPath = resolve(process.cwd(), "artifacts/ingest/latest.json");
  const raw = await readFile(inputPath, "utf8");
  const report: IngestionReport = {
    generatedAt: new Date().toISOString(),
    inputPath,
    dryRun: hasFlag("--dry-run"),
    validation: validateCorpus(JSON.parse(raw) as unknown),
  };

  if (!report.validation.valid) {
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }

  if (!report.dryRun) {
    await mkdir(resolve(process.cwd(), "artifacts/ingest"), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Ingestion failed");
  process.exitCode = 1;
});
