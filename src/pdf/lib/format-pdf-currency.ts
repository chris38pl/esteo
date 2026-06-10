export function formatPdfCurrency(amount: number, currency: string, locale: "pl" | "en"): string {
  return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPdfQuantity(value: number, locale: "pl" | "en"): string {
  return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
