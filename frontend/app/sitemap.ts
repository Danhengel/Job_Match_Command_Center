import type { MetadataRoute } from "next";
import { publicPageSlugs } from "@/lib/publicPages";

const SITE_URL = "https://careernaviq.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...publicPageSlugs.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: now,
      changeFrequency: slug === "privacy" || slug === "terms" ? "monthly" as const : "weekly" as const,
      priority: slug === "features" ? 0.9 : 0.75,
    })),
  ];
}
