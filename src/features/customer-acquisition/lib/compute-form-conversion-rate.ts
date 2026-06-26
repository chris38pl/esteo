import type { Locale } from "@/lib/locale";

export function formatFormConversionRate(
  submissions: number,
  visits: number,
  locale: Locale,
): string {
  if (visits === 0) {
    return "—";
  }

  const rate = (submissions / visits) * 100;
  const formatted = rate.toLocaleString(locale === "pl" ? "pl-PL" : "en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  return `${formatted}%`;
}
