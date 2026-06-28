import type { MetadataRoute } from "next";

import { buildMarketingSitemap } from "@/features/marketing/seo/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildMarketingSitemap();
}
