import type { Locale } from "@/lib/locale";
import { buildCanonicalUrl } from "@/features/marketing/lib/build-canonical";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import { siteConfig } from "@/features/marketing/seo/site-config";

export function buildLocalePaths(path: string = "/"): Record<Locale, string> {
  return Object.fromEntries(
    siteConfig.locales.map((locale) => [locale, buildLocalizedPath(locale, path)]),
  ) as Record<Locale, string>;
}

export function buildLocaleAlternates(path: string = "/"): Record<Locale, string> {
  return Object.fromEntries(
    siteConfig.locales.map((locale) => [locale, buildCanonicalUrl(locale, path)]),
  ) as Record<Locale, string>;
}
