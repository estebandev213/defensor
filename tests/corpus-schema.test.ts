import { describe, expect, it } from "vitest";
import { validateCorpus } from "@/server/legal/corpus-schema";

const sourceId = "00000000-0000-4000-8000-000000000001";
const documentId = "00000000-0000-4000-8000-000000000002";
const chunkId = "00000000-0000-4000-8000-000000000003";

describe("legal corpus validation", () => {
  it("accepts the explicit empty foundation seed", () => {
    const report = validateCorpus({
      version: "foundation-empty",
      parserVersion: "1.0.0",
      sources: [],
      documents: [],
      chunks: [],
    });

    expect(report.valid).toBe(true);
    expect(report.sources).toBe(0);
    expect(report.chunks).toBe(0);
  });

  it("requires references and rejects duplicate chunk indexes", () => {
    const report = validateCorpus({
      version: "test",
      parserVersion: "1.0.0",
      sources: [
        {
          id: sourceId,
          title: "Test source",
          normType: "test",
          officialPublisher: "Test publisher",
          officialUrl: "https://example.com/source",
          sourceDomain: "example.com",
          status: "desconocida",
          retrievedAt: "2026-07-24T00:00:00.000Z",
          contentHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        },
      ],
      documents: [
        {
          id: documentId,
          sourceId,
          version: "1",
          rawText: "Test text",
          normalizedText: "Test text",
          parserVersion: "1.0.0",
          createdAt: "2026-07-24T00:00:00.000Z",
        },
      ],
      chunks: [
        {
          id: chunkId,
          documentId,
          sourceId,
          chunkIndex: 0,
          exactText: "Test chunk",
          normalizedText: "Test chunk",
          citationLabel: "Test citation",
          status: "desconocida",
        },
        {
          id: "00000000-0000-4000-8000-000000000004",
          documentId,
          sourceId,
          chunkIndex: 0,
          exactText: "Duplicate chunk",
          normalizedText: "Duplicate chunk",
          citationLabel: "Duplicate citation",
          status: "desconocida",
        },
      ],
    });

    expect(report.valid).toBe(false);
    expect(report.duplicateChunkKeys).toContain(`${documentId}:0`);
  });
});
