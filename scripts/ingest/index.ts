import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createDatabaseClient, type DatabaseClient } from "@/db/client";
import { createEmbeddingProviderFromEnv } from "@/server/ai/providers/embedding";
import { EMBEDDING_DIMENSIONS } from "@/server/rag/providers";
import {
  LegalCorpusSeedSchema,
  type LegalCorpusSeed,
  validateCorpus,
} from "@/server/legal/corpus-schema";

const INPUT_PATH = resolve(process.cwd(), "data/legal/corpus.seed.json");
const REPORT_PATH = resolve(process.cwd(), "artifacts/ingest/latest.json");
const EMBEDDING_BATCH_SIZE = 32;

interface EmbeddingDimensionRow {
  embedding_type: string | null;
}

interface IngestionReport {
  generatedAt: string;
  inputPath: string;
  dryRun: boolean;
  embeddingDimensions: number;
  embeddingBatches: number;
  sources: number;
  documents: number;
  chunks: number;
  upserted: boolean;
  validation: ReturnType<typeof validateCorpus>;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function batches<T>(items: readonly T[], batchSize: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    result.push([...items.slice(index, index + batchSize)]);
  }
  return result;
}

async function readCorpus(): Promise<{ corpus: LegalCorpusSeed; validation: ReturnType<typeof validateCorpus> }> {
  const raw = await readFile(INPUT_PATH, "utf8");
  const parsed: unknown = JSON.parse(raw);
  const validation = validateCorpus(parsed);
  if (!validation.valid) {
    throw new Error(`Corpus validation failed: ${validation.errors.join("; ")}`);
  }

  const corpus = LegalCorpusSeedSchema.parse(parsed);
  return { corpus, validation };
}

async function assertDatabaseDimension(db: DatabaseClient): Promise<void> {
  const rows = await db<EmbeddingDimensionRow[]>`
    select format_type(attribute.atttypid, attribute.atttypmod) as embedding_type
    from pg_attribute as attribute
    join pg_class as relation on relation.oid = attribute.attrelid
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'legal_chunks'
      and attribute.attname = 'embedding'
      and not attribute.attisdropped
    limit 1
  `;
  const actualType = rows[0]?.embedding_type ?? null;
  const expectedType = `vector(${EMBEDDING_DIMENSIONS})`;
  if (actualType !== expectedType) {
    throw new Error(`Embedding dimension mismatch: database has ${actualType ?? "no embedding column"}, expected ${expectedType}.`);
  }
}

async function generateEmbeddings(corpus: LegalCorpusSeed): Promise<Map<string, number[]>> {
  const provider = createEmbeddingProviderFromEnv();
  const vectors = new Map<string, number[]>();
  const chunkBatches = batches(corpus.chunks, EMBEDDING_BATCH_SIZE);

  for (const [batchIndex, batch] of chunkBatches.entries()) {
    console.log(`Embedding batch ${batchIndex + 1}/${chunkBatches.length} (${batch.length} chunks)`);
    const embeddings = await provider.embedDocuments(batch.map((chunk) => chunk.normalizedText));
    if (embeddings.length !== batch.length) {
      throw new Error(`Embedding provider returned ${embeddings.length} vectors for ${batch.length} chunks.`);
    }
    for (const [index, embedding] of embeddings.entries()) {
      if (embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(`Embedding dimension mismatch: expected ${EMBEDDING_DIMENSIONS}, received ${embedding.length}.`);
      }
      vectors.set(batch[index].id, embedding);
    }
  }

  return vectors;
}

async function upsertCorpus(db: DatabaseClient, corpus: LegalCorpusSeed, embeddings: Map<string, number[]>): Promise<void> {
  await db.begin(async (transaction) => {
    for (const source of corpus.sources) {
      await transaction`
        insert into legal_sources (
          id, title, norm_type, norm_number, official_publisher, official_url,
          source_domain, publication_date, effective_from, effective_to, status,
          retrieved_at, content_hash, metadata
        ) values (
          ${source.id}::uuid, ${source.title}, ${source.normType}, ${source.normNumber ?? null},
          ${source.officialPublisher}, ${source.officialUrl}, ${source.sourceDomain},
          ${source.publicationDate ?? null}::date, ${source.effectiveFrom ?? null}::date,
          ${source.effectiveTo ?? null}::date, ${source.status}, ${source.retrievedAt}::timestamptz,
          ${source.contentHash}, ${JSON.stringify(source.metadata)}::jsonb
        )
        on conflict (id) do update set
          title = excluded.title,
          norm_type = excluded.norm_type,
          norm_number = excluded.norm_number,
          official_publisher = excluded.official_publisher,
          official_url = excluded.official_url,
          source_domain = excluded.source_domain,
          publication_date = excluded.publication_date,
          effective_from = excluded.effective_from,
          effective_to = excluded.effective_to,
          status = excluded.status,
          retrieved_at = excluded.retrieved_at,
          content_hash = excluded.content_hash,
          metadata = excluded.metadata
      `;
    }

    for (const document of corpus.documents) {
      await transaction`
        insert into legal_documents (
          id, source_id, version, raw_text, normalized_text, language,
          legal_regime, topics, parser_version, created_at
        ) values (
          ${document.id}::uuid, ${document.sourceId}::uuid, ${document.version},
          ${document.rawText}, ${document.normalizedText}, ${document.language},
          ${transaction.array(document.legalRegime)}::text[], ${transaction.array(document.topics)}::text[],
          ${document.parserVersion}, ${document.createdAt}::timestamptz
        )
        on conflict (id) do update set
          source_id = excluded.source_id,
          version = excluded.version,
          raw_text = excluded.raw_text,
          normalized_text = excluded.normalized_text,
          language = excluded.language,
          legal_regime = excluded.legal_regime,
          topics = excluded.topics,
          parser_version = excluded.parser_version,
          created_at = excluded.created_at
      `;
    }

    for (const chunk of corpus.chunks) {
      const embedding = embeddings.get(chunk.id);
      if (!embedding) throw new Error(`Missing embedding for chunk ${chunk.id}.`);
      const embeddingLiteral = `[${embedding.join(",")}]`;
      await transaction`
        insert into legal_chunks (
          id, document_id, source_id, chunk_index, article_label, article_number,
          subsection, heading_path, exact_text, normalized_text, citation_label,
          anchor, legal_regime, topics, effective_from, effective_to, status,
          token_count, embedding, metadata
        ) values (
          ${chunk.id}::uuid, ${chunk.documentId}::uuid, ${chunk.sourceId}::uuid,
          ${chunk.chunkIndex}, ${chunk.articleLabel ?? null}, ${chunk.articleNumber ?? null},
          ${chunk.subsection ?? null}, ${transaction.array(chunk.headingPath)}::text[],
          ${chunk.exactText}, ${chunk.normalizedText}, ${chunk.citationLabel}, ${chunk.anchor ?? null},
          ${transaction.array(chunk.legalRegime)}::text[], ${transaction.array(chunk.topics)}::text[],
          ${chunk.effectiveFrom ?? null}::date, ${chunk.effectiveTo ?? null}::date,
          ${chunk.status}, ${chunk.tokenCount ?? null}, ${embeddingLiteral}::vector,
          ${JSON.stringify(chunk.metadata)}::jsonb
        )
        on conflict (id) do update set
          document_id = excluded.document_id,
          source_id = excluded.source_id,
          chunk_index = excluded.chunk_index,
          article_label = excluded.article_label,
          article_number = excluded.article_number,
          subsection = excluded.subsection,
          heading_path = excluded.heading_path,
          exact_text = excluded.exact_text,
          normalized_text = excluded.normalized_text,
          citation_label = excluded.citation_label,
          anchor = excluded.anchor,
          legal_regime = excluded.legal_regime,
          topics = excluded.topics,
          effective_from = excluded.effective_from,
          effective_to = excluded.effective_to,
          status = excluded.status,
          token_count = excluded.token_count,
          embedding = excluded.embedding,
          metadata = excluded.metadata
      `;
    }
  });
}

async function main(): Promise<void> {
  const dryRun = hasFlag("--dry-run");
  const { corpus, validation } = await readCorpus();
  const embeddingBatches = Math.ceil(corpus.chunks.length / EMBEDDING_BATCH_SIZE);
  const report: IngestionReport = {
    generatedAt: new Date().toISOString(),
    inputPath: INPUT_PATH,
    dryRun,
    embeddingDimensions: EMBEDDING_DIMENSIONS,
    embeddingBatches,
    sources: corpus.sources.length,
    documents: corpus.documents.length,
    chunks: corpus.chunks.length,
    upserted: false,
    validation,
  };

  if (!dryRun) {
    const db = createDatabaseClient();
    try {
      await assertDatabaseDimension(db);
      const embeddings = await generateEmbeddings(corpus);
      await upsertCorpus(db, corpus, embeddings);
      report.upserted = true;
    } finally {
      await db.end();
    }
  }

  await mkdir(resolve(process.cwd(), "artifacts/ingest"), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Ingestion failed");
  process.exitCode = 1;
});
