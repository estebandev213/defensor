import type { MetadataRoute } from "next";
import { publicPaths, siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path, index) => ({
    url: new URL(path, siteConfig.url).toString(),
    lastModified: new Date("2026-07-25T00:00:00.000Z"),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.7,
  }));
}
