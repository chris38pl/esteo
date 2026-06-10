import type { Locale } from "@/lib/locale";

export function buildEstimatePdfDisplayFileName(input: {
  requestNumber: string | null | undefined;
  estimateId: string;
  versionNumber: number;
  locale?: Locale;
}): string {
  const reference =
    input.requestNumber?.trim() ||
    input.estimateId.slice(-8);

  const prefix = input.locale === "en" ? "estimate" : "wycena";

  return `${prefix}-${reference}-v${input.versionNumber}.pdf`;
}

export function buildEstimatePdfViewerTitle(input: {
  requestNumber: string | null | undefined;
  estimateId: string;
  versionNumber: number;
  locale: Locale;
}): string {
  const reference =
    input.requestNumber?.trim() ||
    input.estimateId.slice(-8);

  if (input.locale === "en") {
    return `Estimate ${reference} — v${input.versionNumber}`;
  }

  return `Wycena ${reference} — v${input.versionNumber}`;
}
