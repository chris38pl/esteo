export function formatEstimateCurrency(
  value: number,
  currency: string,
  locale: string,
  options?: { compact?: boolean; fractionDigits?: number },
): string {
  const fractionDigits = options?.fractionDigits ?? 2;
  return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    ...(options?.compact ? { notation: "compact" as const } : {}),
  }).format(value);
}

export function formatEstimateDecimal(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
