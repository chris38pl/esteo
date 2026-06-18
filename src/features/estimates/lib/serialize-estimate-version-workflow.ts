import type { EstimateSendTransportStatus, EstimateVersionStatus } from "@prisma/client";

export type EstimateVersionWorkflowClient = {
  status: EstimateVersionStatus;
  archivedAt: string | null;
  lastSentAt: string | null;
  lastSentToEmail: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  successfulSendCount: number;
  activeSend: {
    id: string;
    transportStatus: EstimateSendTransportStatus;
    runId: string | null;
  } | null;
  defaultCustomerEmail: string | null;
};

export function extractCustomerEmail(customerData: unknown): string | null {
  if (!customerData || typeof customerData !== "object") {
    return null;
  }

  const email = (customerData as { email?: unknown }).email;
  return typeof email === "string" && email.trim().length > 0 ? email.trim() : null;
}
