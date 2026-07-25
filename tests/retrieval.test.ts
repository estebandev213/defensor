import { describe, expect, it } from "vitest";
import { deduplicateChunks, diversifyChunks } from "@/server/rag/deduplicate";
import { fuseRankedResults, reciprocalRank } from "@/server/rag/rrf";
import { toPgVectorLiteral } from "@/server/rag/vector";
import type { RankedRetrievedChunk, RetrievedChunk } from "@/server/rag/types";

function chunk(id: string, sourceId: string, fusionScore = 0, topics: string[] = ["despido"]): RetrievedChunk {
  return {
    id,
    sourceId,
    text: `Text ${id}`,
    articleLabel: "Artículo 1",
    citationLabel: `Cita ${id}`,
    officialUrl: "https://example.com",
    fusionScore,
    status: "vigente",
    legalRegime: ["privado_general"],
    topics,
  };
}

function ranked(id: string, rank: number, channel: RankedRetrievedChunk["channel"]): RankedRetrievedChunk {
  const base = chunk(id, `source-${id}`);
  return { chunk: channel === "semantic" ? { ...base, semanticScore: 0.9 } : { ...base, lexicalScore: 0.8 }, rank, channel };
}

describe("retrieval ranking", () => {
  it("calculates reciprocal rank with the configured constant", () => {
    expect(reciprocalRank(1, 60)).toBeCloseTo(1 / 61);
  });

  it("fuses two channels and preserves both score types", () => {
    const result = fuseRankedResults([ranked("shared", 1, "semantic")], [ranked("shared", 2, "lexical"), ranked("lexical", 1, "lexical")], 5);

    expect(result[0]?.id).toBe("shared");
    expect(result[0]?.semanticScore).toBe(0.9);
    expect(result[0]?.lexicalScore).toBe(0.8);
    expect(result[0]?.fusionScore).toBeGreaterThan(result[1]?.fusionScore ?? 0);
  });
});

describe("retrieval post-processing", () => {
  it("deduplicates equivalent text and keeps the strongest result", () => {
    const first = chunk("first", "source", 0.4);
    const duplicate = { ...chunk("second", "source", 0.8), text: "  TEXT FIRST  " };

    const result = deduplicateChunks([first, duplicate]);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("second");
  });

  it("adds source and topic diversity when scores are close", () => {
    const result = diversifyChunks([
      chunk("a", "source-a", 0.8, ["despido"]),
      chunk("b", "source-a", 0.79, ["despido"]),
      chunk("c", "source-b", 0.78, ["cts"]),
    ], 2);

    expect(result.map((item) => item.id)).toEqual(["a", "c"]);
  });
});

describe("vector formatting", () => {
  it("creates a pgvector literal and rejects invalid values", () => {
    expect(toPgVectorLiteral([0.1, -0.2])).toBe("[0.1,-0.2]");
    expect(() => toPgVectorLiteral([])).toThrow("cannot be empty");
    expect(() => toPgVectorLiteral([Number.NaN])).toThrow("non-finite");
  });
});
