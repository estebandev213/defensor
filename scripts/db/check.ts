import { createDatabaseClient } from "@/db/client";
import { EMBEDDING_DIMENSIONS } from "@/server/rag/providers";

interface TableCheckRow {
  table_name: string;
  present: boolean;
}

interface EmbeddingDimensionRow {
  embedding_type: string | null;
}

async function main(): Promise<void> {
  const db = createDatabaseClient();

  try {
    const tables = await db<TableCheckRow[]>`
      select table_name, to_regclass('public.' || table_name) is not null as present
      from unnest(array['legal_sources', 'legal_documents', 'legal_chunks', 'feedback_events']) as table_name
    `;
    const missingTables = tables.filter((table) => !table.present).map((table) => table.table_name);
    const extensions = await db<{ extname: string }[]>`
      select extname from pg_extension where extname in ('pgcrypto', 'vector') order by extname
    `;
    const embeddingDimensions = await db<EmbeddingDimensionRow[]>`
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
    const embeddingType = embeddingDimensions[0]?.embedding_type ?? null;
    const expectedEmbeddingType = `vector(${EMBEDDING_DIMENSIONS})`;
    const result = {
      ok:
        missingTables.length === 0 &&
        extensions.some((extension) => extension.extname === "vector") &&
        embeddingType === expectedEmbeddingType,
      tables,
      extensions: extensions.map((extension) => extension.extname),
      missingTables,
      embedding: {
        actualType: embeddingType,
        expectedType: expectedEmbeddingType,
        dimensionsMatch: embeddingType === expectedEmbeddingType,
      },
    };
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Database check failed");
  process.exitCode = 1;
});
