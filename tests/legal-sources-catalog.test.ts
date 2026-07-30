import { describe, expect, it } from "vitest";
import {
  getPublicLegalSources,
  getSourceFilterOptions,
  getSourcesCatalogStats,
} from "@/lib/legal-sources-catalog";

describe("public legal sources catalog", () => {
  it("derives transparent counts from the reviewed source inventory", () => {
    const sources = getPublicLegalSources();
    const stats = getSourcesCatalogStats();

    expect(stats).toEqual({
      totalDocuments: 23,
      lawsAndDecrees: 6,
      regulationsAndResolutions: 15,
    });
    expect(sources).toHaveLength(stats.totalDocuments);
    expect(sources.some((source) => source.statusTone === "caution")).toBe(true);
    expect(sources.some((source) => source.statusTone === "modified")).toBe(
      true,
    );
  });

  it("publishes only HTTPS links and labels dates as references", () => {
    const sources = getPublicLegalSources();

    for (const source of sources) {
      if (source.officialUrl) {
        expect(source.officialUrl).toMatch(/^https:\/\//);
      }
      expect(source.referenceDateLabel).not.toBe("");
      expect(source).not.toHaveProperty("updatedLabel");
    }

    expect(
      sources.some(
        (source) =>
          source.officialUrl === null &&
          source.statusLabel === "Pendiente de verificación",
      ),
    ).toBe(true);
  });

  it("builds sorted filter options from public labels", () => {
    const options = getSourceFilterOptions();

    expect(options.types).toEqual([...options.types].sort());
    expect(options.entities).toEqual([...options.entities].sort());
    expect(options.topics).toEqual([...options.topics].sort());
    expect(options.topics).toContain("CTS");
    expect(options.entities).toContain("SUNAFIL");
  });
});
