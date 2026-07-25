import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCorpusBackup } from "@/server/legal/export";

async function main(): Promise<void> {
  const inputPath = path.resolve(process.cwd(), "data/legal/corpus.seed.json");
  const outputDirectory = path.resolve(process.cwd(), "artifacts/backups");
  const raw = await readFile(inputPath, "utf8");
  const backup = createCorpusBackup(JSON.parse(raw) as unknown);
  await mkdir(outputDirectory, { recursive: true });
  const outputPath = path.join(outputDirectory, "latest-corpus.json");
  await writeFile(outputPath, `${JSON.stringify(backup, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ outputPath, corpusHash: backup.corpusHash, sources: backup.validation.sources, chunks: backup.validation.chunks }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Corpus export failed");
  process.exitCode = 1;
});

