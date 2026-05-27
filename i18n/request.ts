import { getRequestConfig } from "next-intl/server";

import type { Locale } from "../src/lib/locale";
import { isLocale } from "../src/lib/locale";

import en from "../src/messages/en.json";
import pl from "../src/messages/pl.json";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale: Locale = locale && isLocale(locale) ? locale : "pl";
  const messages = resolvedLocale === "pl" ? pl : en;

  return {
    locale: resolvedLocale,
    messages,
  };
});

