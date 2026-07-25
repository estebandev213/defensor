import { createHash } from "node:crypto";
import { LegalCorpusSeedSchema, validateCorpus, type LegalCorpusSeed } from "@/server/legal/corpus-schema";

export interface CorpusBackup {
  backupVersion: 1;
  exportedAt: string;
  corpusHash: string;
  validation: ReturnType<typeof validateCorpus>;
  corpus: LegalCorpusSeed;
}

export function createCorpusBackup(input: unknown, exportedAt = new Date().toISOString()): CorpusBackup {
  const corpus = LegalCorpusSeedSchema.parse(input);
  const canonical = JSON.stringify(corpus);
  return {
    backupVersion: 1,
    exportedAt,
    corpusHash: createHash("sha256").update(canonical).digest("hex"),
    validation: validateCorpus(corpus),
    corpus,
  };
}

