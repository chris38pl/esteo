import type { EstimateImportListItem } from "@/features/estimate-templates/types/estimate-import";

export function importEstimateMatchesSearch(
  estimate: Pick<
    EstimateImportListItem,
    "title" | "requestNumber" | "customerName" | "investmentLabel"
  >,
  query: string,
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    estimate.title,
    estimate.requestNumber,
    estimate.customerName,
    estimate.investmentLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}
