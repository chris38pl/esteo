import { getLocale, getTranslations } from "next-intl/server";

import { defaultLocale, isLocale, type Locale } from "@/lib/locale";

/** Resolve locale from route params, falling back to the active request locale. */
export async function resolveRequestLocale(localeParam?: string): Promise<Locale> {
  if (localeParam && isLocale(localeParam)) {
    return localeParam;
  }

  const fromRequest = await getLocale();
  return isLocale(fromRequest) ? fromRequest : defaultLocale;
}

/** Server-side translations with explicit route locale (avoids defaultLocale fallback). */
export async function getServerTranslations(locale: Locale, namespace: string) {
  return getTranslations({ locale, namespace });
}
