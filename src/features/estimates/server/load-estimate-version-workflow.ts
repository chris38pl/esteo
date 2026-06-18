"use server";

import "server-only";

import { prisma } from "@/db/client";
import {
  countSuccessfulSendAttempts,
  findActiveSendAttempt,
} from "@/features/estimates/server/get-estimate-send-attempts";
import {
  extractCustomerEmail,
  type EstimateVersionWorkflowClient,
} from "@/features/estimates/lib/serialize-estimate-version-workflow";

export async function loadEstimateVersionWorkflow(
  versionId: string,
  workspaceId: string,
  customerData: unknown,
): Promise<EstimateVersionWorkflowClient | null> {
  const version = await prisma.estimateVersion.findFirst({
    where: { id: versionId, workspaceId },
    select: {
      status: true,
      archivedAt: true,
      lastSentAt: true,
      lastSentToEmail: true,
      acceptedAt: true,
      rejectedAt: true,
    },
  });

  if (!version) {
    return null;
  }

  const [successfulSendCount, activeSend] = await Promise.all([
    countSuccessfulSendAttempts(versionId),
    findActiveSendAttempt(versionId),
  ]);

  return {
    status: version.status,
    archivedAt: version.archivedAt?.toISOString() ?? null,
    lastSentAt: version.lastSentAt?.toISOString() ?? null,
    lastSentToEmail: version.lastSentToEmail,
    acceptedAt: version.acceptedAt?.toISOString() ?? null,
    rejectedAt: version.rejectedAt?.toISOString() ?? null,
    successfulSendCount,
    activeSend: activeSend
      ? {
          id: activeSend.id,
          transportStatus: activeSend.transportStatus,
          runId: activeSend.triggerRunId,
        }
      : null,
    defaultCustomerEmail: extractCustomerEmail(customerData),
  };
}
