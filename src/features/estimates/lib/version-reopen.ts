import type { EstimateVersionStatus } from "@prisma/client";

import { PermissionError } from "@/server/permissions/errors";

export function canReopenEstimateVersion(status: EstimateVersionStatus): boolean {
  return status === "ACCEPTED" || status === "REJECTED";
}

export function assertCanReopen(version: { status: EstimateVersionStatus }): void {
  if (!canReopenEstimateVersion(version.status)) {
    throw new PermissionError("Reopen is only allowed from ACCEPTED or REJECTED.");
  }
}
