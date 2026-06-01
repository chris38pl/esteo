import { formatDate } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";

export function formatRuleMetaDate(value: Date | string, locale: Locale): string {
  return formatDate(value, locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
