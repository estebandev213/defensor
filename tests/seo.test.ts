import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { publicPaths, topicPages } from "@/lib/site";

describe("public SEO surface", () => {
  it("includes only indexable public routes in the sitemap", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(entries).toHaveLength(publicPaths.length);
    expect(urls.some((url) => url.endsWith("/chat"))).toBe(false);
    expect(urls.some((url) => url.endsWith("/derechos-laborales/despido"))).toBe(true);
  });

  it("disallows chat and API paths for crawlers", () => {
    const rules = robots().rules;
    const firstRule = Array.isArray(rules) ? rules[0] : rules;
    const disallow = firstRule && "disallow" in firstRule ? firstRule.disallow : [];

    expect(disallow).toContain("/chat");
    expect(disallow).toContain("/api/");
  });

  it("keeps the public topic set explicit", () => {
    expect(topicPages.map((topic) => topic.slug)).toEqual([
      "despido",
      "cts",
      "gratificaciones",
      "vacaciones",
      "horas-extras",
    ]);
  });
});
