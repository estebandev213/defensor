import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from "next/constants";
import { describe, expect, it } from "vitest";
import createNextConfig from "../next.config";

describe("Next.js build output isolation", () => {
  it("keeps the development server output separate from production builds", () => {
    expect(createNextConfig(PHASE_DEVELOPMENT_SERVER).distDir).toBe(
      ".next-dev",
    );
    expect(createNextConfig(PHASE_PRODUCTION_BUILD).distDir).toBe(".next");
  });

  it("redirects the removed labor-rights index to the landing topics", async () => {
    const redirects = await createNextConfig(PHASE_PRODUCTION_BUILD).redirects?.();

    expect(redirects).toContainEqual({
      source: "/derechos-laborales",
      destination: "/#temas-principales",
      permanent: true,
    });
  });
});
