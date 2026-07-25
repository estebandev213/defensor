import { z } from "zod";

const uuid = z.string().uuid();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const legalStatus = z.enum(["vigente", "modificada", "derogada", "desconocida"]);

export const LegalSourceSeedSchema = z.object({
  id: uuid,
  title: z.string().min(1),
  normType: z.string().min(1),
  normNumber: z.string().min(1).optional(),
  officialPublisher: z.string().min(1),
  officialUrl: z.string().url(),
  sourceDomain: z.string().min(1),
  publicationDate: date.optional(),
  effectiveFrom: date.optional(),
  effectiveTo: date.optional(),
  status: legalStatus,
  retrievedAt: z.string().datetime({ offset: true }),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/i),
  metadata: z.record(z.unknown()).default({}),
});

export const LegalDocumentSeedSchema = z.object({
  id: uuid,
  sourceId: uuid,
  version: z.string().min(1),
  rawText: z.string().min(1),
  normalizedText: z.string().min(1),
  language: z.string().length(2).default("es"),
  legalRegime: z.array(z.string().min(1)).default([]),
  topics: z.array(z.string().min(1)).default([]),
  parserVersion: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
});

export const LegalChunkSeedSchema = z.object({
  id: uuid,
  documentId: uuid,
  sourceId: uuid,
  chunkIndex: z.number().int().nonnegative(),
  articleLabel: z.string().min(1).optional(),
  articleNumber: z.string().min(1).optional(),
  subsection: z.string().min(1).optional(),
  headingPath: z.array(z.string().min(1)).default([]),
  exactText: z.string().min(1),
  normalizedText: z.string().min(1),
  citationLabel: z.string().min(1),
  anchor: z.string().min(1).optional(),
  legalRegime: z.array(z.string().min(1)).default([]),
  topics: z.array(z.string().min(1)).default([]),
  effectiveFrom: date.optional(),
  effectiveTo: date.optional(),
  status: legalStatus,
  tokenCount: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const LegalCorpusSeedSchema = z.object({
  version: z.string().min(1),
  parserVersion: z.string().min(1),
  sources: z.array(LegalSourceSeedSchema),
  documents: z.array(LegalDocumentSeedSchema),
  chunks: z.array(LegalChunkSeedSchema),
});

export type LegalCorpusSeed = z.infer<typeof LegalCorpusSeedSchema>;

export interface CorpusValidationReport {
  valid: boolean;
  corpusVersion: string | null;
  parserVersion: string | null;
  sources: number;
  documents: number;
  chunks: number;
  errors: string[];
  duplicateSourceHashes: string[];
  duplicateDocumentVersions: string[];
  duplicateChunkKeys: string[];
  topics: Record<string, number>;
}

export function validateCorpus(input: unknown): CorpusValidationReport {
  const parsed = LegalCorpusSeedSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      corpusVersion: null,
      parserVersion: null,
      sources: 0,
      documents: 0,
      chunks: 0,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      duplicateSourceHashes: [],
      duplicateDocumentVersions: [],
      duplicateChunkKeys: [],
      topics: {},
    };
  }

  const corpus = parsed.data;
  const sourceIds = new Set(corpus.sources.map((source) => source.id));
  const documentIds = new Set(corpus.documents.map((document) => document.id));
  const sourceHashes = new Map<string, number>();
  const documentVersions = new Map<string, number>();
  const chunkKeys = new Map<string, number>();
  const topics: Record<string, number> = {};
  const errors: string[] = [];

  for (const source of corpus.sources) {
    sourceHashes.set(source.contentHash, (sourceHashes.get(source.contentHash) ?? 0) + 1);
  }

  for (const document of corpus.documents) {
    if (!sourceIds.has(document.sourceId)) {
      errors.push(`documents.${document.id}: sourceId does not reference a source`);
    }
    const key = `${document.sourceId}:${document.version}`;
    documentVersions.set(key, (documentVersions.get(key) ?? 0) + 1);
  }

  for (const chunk of corpus.chunks) {
    if (!sourceIds.has(chunk.sourceId)) {
      errors.push(`chunks.${chunk.id}: sourceId does not reference a source`);
    }
    if (!documentIds.has(chunk.documentId)) {
      errors.push(`chunks.${chunk.id}: documentId does not reference a document`);
    }
    const key = `${chunk.documentId}:${chunk.chunkIndex}`;
    chunkKeys.set(key, (chunkKeys.get(key) ?? 0) + 1);
    for (const topic of chunk.topics) {
      topics[topic] = (topics[topic] ?? 0) + 1;
    }
  }

  const duplicateSourceHashes = [...sourceHashes.entries()].filter(([, count]) => count > 1).map(([hash]) => hash);
  const duplicateDocumentVersions = [...documentVersions.entries()].filter(([, count]) => count > 1).map(([key]) => key);
  const duplicateChunkKeys = [...chunkKeys.entries()].filter(([, count]) => count > 1).map(([key]) => key);

  if (duplicateSourceHashes.length > 0) errors.push("Duplicate source content hashes found");
  if (duplicateDocumentVersions.length > 0) errors.push("Duplicate source/document versions found");
  if (duplicateChunkKeys.length > 0) errors.push("Duplicate document/chunk indexes found");

  return {
    valid: errors.length === 0,
    corpusVersion: corpus.version,
    parserVersion: corpus.parserVersion,
    sources: corpus.sources.length,
    documents: corpus.documents.length,
    chunks: corpus.chunks.length,
    errors,
    duplicateSourceHashes,
    duplicateDocumentVersions,
    duplicateChunkKeys,
    topics,
  };
}
