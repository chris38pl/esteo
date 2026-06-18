import type { BillingChangePreview } from "@/features/billing/billing-page-data";

export function isBillingPreviewExpired(preview: BillingChangePreview | null): boolean {
  if (!preview) {
    return false;
  }
  return Date.now() > Date.parse(preview.previewExpiresAt);
}
