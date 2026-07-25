import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("initial data migration", () => {
  it("defines the legal corpus tables and required indexes", async () => {
    const migration = await readFile(resolve(process.cwd(), "src/db/migrations/001_initial_schema.sql"), "utf8");

    expect(migration).toContain("create extension if not exists vector");
    expect(migration).toContain("create table if not exists legal_sources");
    expect(migration).toContain("create table if not exists legal_documents");
    expect(migration).toContain("create table if not exists legal_chunks");
    expect(migration).toContain("legal_chunks_embedding_idx");
    expect(migration).toContain("legal_chunks_search_idx");
    expect(migration).toContain("create table if not exists feedback_events");
  });
});
