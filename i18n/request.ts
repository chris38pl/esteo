import { getRequestConfig } from "next-intl/server";

import type { Locale } from "../src/lib/locale";
import { isLocale } from "../src/lib/locale";

import { getMessagesForLocale } from "../src/i18n/messages";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale: Locale = locale && isLocale(locale) ? locale : "pl";
  const messages = getMessagesForLocale(resolvedLocale);

  return {
    locale: resolvedLocale,
    messages,
  };
});

