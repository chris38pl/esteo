import { getLocale, getTranslations } from "next-intl/server";
import type { NamespaceKeys, NestedKeyOf } from "use-intl/core";

import type { Messages, Namespace } from "@/i18n/messages";
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
export async function getServerTranslations<N extends Namespace>(locale: Locale, namespace: N) {
  return getTranslations<N & NamespaceKeys<Messages, NestedKeyOf<Messages>>>({
    locale,
    namespace: namespace as N & NamespaceKeys<Messages, NestedKeyOf<Messages>>,
  });
}
