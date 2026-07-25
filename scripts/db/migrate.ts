import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createDatabaseClient } from "@/db/client";

async function main(): Promise<void> {
  const migrationDirectory = resolve(process.cwd(), "src/db/migrations");
  const files = (await readdir(migrationDirectory)).filter((file) => file.endsWith(".sql")).sort();
  const db = createDatabaseClient();

  try {
    await db.unsafe(`
      create table if not exists schema_migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      )
    `);
    for (const file of files) {
      const id = file.replace(/\.sql$/, "");
      const applied = await db<{ id: string }[]>`select id from schema_migrations where id = ${id} limit 1`;
      if (applied.length > 0) {
        console.log(`Skipping ${file}`);
        continue;
      }

      const migration = await readFile(join(migrationDirectory, file), "utf8");
      await db.begin(async (transaction) => {
        await transaction.unsafe(migration);
        await transaction`insert into schema_migrations (id) values (${id})`;
      });
      console.log(`Applied ${file}`);
    }
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Database migration failed");
  process.exitCode = 1;
});
