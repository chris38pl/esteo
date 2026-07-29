import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export function resolveIntegrationLocale(request: Request, formLocale?: string | null): Locale {
  if (formLocale && isLocale(formLocale)) {
    return formLocale;
  }

  const queryLocale = new URL(request.url).searchParams.get("locale");
  if (queryLocale && isLocale(queryLocale)) {
    return queryLocale;
  }

  const accept = request.headers.get("accept-language") ?? "";
  const primary = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("en")) {
    return "en";
  }
  if (primary.startsWith("pl")) {
    return "pl";
  }

  return "en";
}
