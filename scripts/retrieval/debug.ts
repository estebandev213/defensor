import { createDatabaseClient } from "@/db/client";
import { PostgresLegalCatalogRepository } from "@/server/legal/repository";

function readArgument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

async function main(): Promise<void> {
  const query = readArgument("query");
  if (!query) throw new Error("Usage: pnpm retrieval:debug --query=\"consulta laboral\"");

  const db = createDatabaseClient();
  try {
    const repository = new PostgresLegalCatalogRepository(db);
    const results = await repository.hybridSearch({
      query,
      legalRegime: readArgument("regime"),
      topics: readArgument("topics")?.split(",").map((topic) => topic.trim()).filter(Boolean),
      semanticLimit: 10,
      lexicalLimit: 10,
      finalLimit: 5,
    });
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Retrieval debug failed");
  process.exitCode = 1;
});
