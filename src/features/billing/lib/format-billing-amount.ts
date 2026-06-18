import type { Locale } from "@/lib/locale";
import { formatCurrency } from "@/i18n/formatters";

/** Formats catalog cents as a monthly price label (e.g. 99,99 zł). */
export function formatBillingMonthlyPrice(
  cents: number,
  locale: Locale,
  currency: "PLN" | "EUR" = "PLN",
): string {
  return formatCurrency(cents / 100, locale, currency, {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatSignedBillingAmount(
  cents: number,
  locale: Locale,
  currency: "PLN" | "EUR" = "PLN",
): string {
  const absolute = formatBillingMonthlyPrice(Math.abs(cents), locale, currency);
  if (cents > 0) {
    return `+${absolute}`;
  }
  if (cents < 0) {
    return `-${absolute}`;
  }
  return absolute;
}
