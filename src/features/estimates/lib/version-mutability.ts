import type { EstimateSendTransportStatus, EstimateVersionStatus } from "@prisma/client";

const READ_ONLY_STATUSES: EstimateVersionStatus[] = ["SENT", "ACCEPTED", "REJECTED"];

const ACTIVE_SEND_TRANSPORT_STATUSES: EstimateSendTransportStatus[] = [
  "QUEUED",
  "GENERATING_PDF",
  "SENDING",
];

export function isEstimateVersionArchived(
  archivedAt: Date | string | null | undefined,
): boolean {
  return archivedAt != null;
}

export function isEstimateVersionContentEditable(input: {
  status: EstimateVersionStatus;
  archivedAt: Date | string | null | undefined;
}): boolean {
  if (isEstimateVersionArchived(input.archivedAt)) {
    return false;
  }

  return !READ_ONLY_STATUSES.includes(input.status);
}

/** @deprecated Use isEstimateVersionContentEditable — kept for gradual migration */
export function isEstimateVersionEditable(status: EstimateVersionStatus): boolean {
  return status === "DRAFT";
}

export function hasActiveSendJob(transportStatus: EstimateSendTransportStatus | null | undefined): boolean {
  if (!transportStatus) {
    return false;
  }

  return ACTIVE_SEND_TRANSPORT_STATUSES.includes(transportStatus);
}

export function isEstimateVersionBlockedBySendJob(input: {
  status: EstimateVersionStatus;
  activeSendTransportStatus: EstimateSendTransportStatus | null | undefined;
}): boolean {
  return input.status === "DRAFT" && hasActiveSendJob(input.activeSendTransportStatus);
}
