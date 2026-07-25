import { createDatabaseClient } from "@/db/client";

interface TableCheckRow {
  table_name: string;
  present: boolean;
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
    const result = {
      ok: missingTables.length === 0 && extensions.some((extension) => extension.extname === "vector"),
      tables,
      extensions: extensions.map((extension) => extension.extname),
      missingTables,
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
