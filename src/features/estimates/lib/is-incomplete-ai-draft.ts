import type { EstimateRequestStatus, EstimateVersionStatus } from "@prisma/client";

import { isEstimateVersionEditable } from "@/features/estimates/lib/version-mutability";

export function isIncompleteAiDraft(input: {
  hasEstimateRequest: boolean;
  sectionCount: number;
  versionStatus: EstimateVersionStatus | null | undefined;
}): boolean {
  if (!input.hasEstimateRequest) {
    return false;
  }

  if (input.sectionCount > 0) {
    return false;
  }

  if (!input.versionStatus || !isEstimateVersionEditable(input.versionStatus)) {
    return false;
  }

  return true;
}

export type EstimateDraftRecoveryInput = {
  hasEstimateRequest: boolean;
  status: EstimateRequestStatus | null | undefined;
  sectionCount: number;
  versionStatus: EstimateVersionStatus | null | undefined;
  updatedAt: Date;
  now?: Date;
};
