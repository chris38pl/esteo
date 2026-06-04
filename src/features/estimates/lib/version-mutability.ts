import type { EstimateVersionStatus } from "@prisma/client";

export function isEstimateVersionEditable(status: EstimateVersionStatus): boolean {
  return status !== "ARCHIVED";
}
