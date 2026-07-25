import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateCorpus } from "@/server/legal/corpus-schema";

async function main(): Promise<void> {
  const inputPath = resolve(process.cwd(), "data/legal/corpus.seed.json");
  const raw = await readFile(inputPath, "utf8");
  const report = validateCorpus(JSON.parse(raw) as unknown);

  console.log(JSON.stringify(report, null, 2));
  if (!report.valid) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Corpus validation failed");
  process.exitCode = 1;
});
