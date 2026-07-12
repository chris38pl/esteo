import { parseRequestCustomerData } from "@/features/estimate-requests/lib/parse-request-json";

export type EstimateEntityTitleInput = {
  title?: string | null;
  name?: string | null;
  clientName?: string | null;
  reference?: string | null;
};

export function resolveEstimateEntityTitle(
  estimate: EstimateEntityTitleInput,
  fallbackLabel: string,
): string {
  const candidates = [
    estimate.title,
    estimate.name,
    estimate.clientName,
    estimate.reference,
  ];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return fallbackLabel;
}

export function extractClientNameFromCustomerData(raw: unknown): string | null {
  const customer = parseRequestCustomerData(raw);
  const fullName = customer?.fullName?.trim();
  return fullName || null;
}
