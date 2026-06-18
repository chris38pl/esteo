import type { WorkspaceIndustry } from "@prisma/client";

import { isServiceWorkspace } from "@/features/workspaces/lib/industries";

export type EstimateRequestAddressInput = {
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  voivodeship?: string;
  serviceLocation?: string;
};

export function normalizeEstimateRequestAddress(
  industry: WorkspaceIndustry,
  address: EstimateRequestAddressInput,
): Record<string, string> {
  if (isServiceWorkspace(industry)) {
    return {
      serviceLocation: address.serviceLocation?.trim() ?? "",
    };
  }

  return {
    streetAddress: address.streetAddress?.trim() ?? "",
    city: address.city?.trim() ?? "",
    postalCode: address.postalCode?.trim() ?? "",
    voivodeship: address.voivodeship?.trim() ?? "",
  };
}
