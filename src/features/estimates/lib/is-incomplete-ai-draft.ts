import type { EstimateRequestStatus, EstimateVersionStatus } from "@prisma/client";

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

  if (!input.versionStatus || input.versionStatus !== "DRAFT") {
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
