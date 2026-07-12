import type { Metadata } from "next";

import { siteConfig } from "@/features/marketing/seo/site-config";

export function createAppMetadata({ title }: { title: string }): Metadata {
  const trimmed = title.trim();
  const isBrandOnly = trimmed === siteConfig.name;

  return {
    title: isBrandOnly ? { absolute: siteConfig.name } : trimmed,
    robots: {
      index: false,
      follow: false,
    },
  };
}