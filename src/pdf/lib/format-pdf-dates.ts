const PDF_VALIDITY_DAYS = 14;

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function formatPdfDate(date: Date, locale: "pl" | "en"): string {
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function buildPdfIssueDates(issueDate: Date, locale: "pl" | "en") {
  const validUntil = addDays(issueDate, PDF_VALIDITY_DAYS);

  return {
    issueDate,
    validUntil,
    issueDateFormatted: formatPdfDate(issueDate, locale),
    validUntilFormatted: formatPdfDate(validUntil, locale),
    validityDays: PDF_VALIDITY_DAYS,
  };
}
