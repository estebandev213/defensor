import postgres from "postgres";
import { env } from "@/server/security/env";

export type DatabaseClient = ReturnType<typeof postgres>;

export function createDatabaseClient(): DatabaseClient {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database operations.");
  }

  return postgres(env.DATABASE_URL, {
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
    ssl: env.NODE_ENV === "production" ? "require" : false,
  });
}
