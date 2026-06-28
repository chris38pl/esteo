import type { MetadataRoute } from "next";

import { buildCanonicalUrl } from "@/features/marketing/lib/build-canonical";
import { siteConfig } from "@/features/marketing/seo/site-config";

export function buildMarketingSitemap(): MetadataRoute.Sitemap {
  return siteConfig.launchRoutes
    .filter((route) => route.implemented && route.includeInSitemap)
    .flatMap((route) =>
      siteConfig.locales.map((locale) => ({
        url: buildCanonicalUrl(locale, route.path),
        changeFrequency: "weekly" as const,
        priority: route.id === "home" ? 1 : 0.7,
      })),
    );
}
