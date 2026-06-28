import type { Locale } from "@/lib/locale";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import { siteConfig } from "@/features/marketing/seo/site-config";

export function buildCanonicalUrl(locale: Locale, path: string = "/"): string {
  return `${siteConfig.url}${buildLocalizedPath(locale, path)}`;
}
