import "server-only";

import { prisma } from "@/db/client";
import { ACTIVE_SEND_TRANSPORT_STATUSES } from "@/features/estimates/lib/estimate-send-constants";

export async function getEstimateSendAttempts(versionId: string) {
  return prisma.estimateVersionSend.findMany({
    where: { versionId },
    orderBy: { sentAt: { sort: "desc", nulls: "last" } },
    select: {
      id: true,
      sentToEmail: true,
      deliveredToEmail: true,
      sentAt: true,
      transportStatus: true,
      errorMessage: true,
      emailSubject: true,
      attachPdf: true,
      isResend: true,
      resendMessageId: true,
      createdAt: true,
      sentBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function countSuccessfulSendAttempts(versionId: string): Promise<number> {
  return prisma.estimateVersionSend.count({
    where: {
      versionId,
      transportStatus: { in: ["PROVIDER_ACCEPTED", "DELIVERED"] },
    },
  });
}

export async function findActiveSendAttempt(versionId: string) {
  return prisma.estimateVersionSend.findFirst({
    where: {
      versionId,
      transportStatus: { in: ACTIVE_SEND_TRANSPORT_STATUSES },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      transportStatus: true,
      triggerRunId: true,
    },
  });
}

export async function findSendAttemptById(sendId: string, workspaceId: string) {
  return prisma.estimateVersionSend.findFirst({
    where: { id: sendId, workspaceId },
    select: {
      id: true,
      versionId: true,
      workspaceId: true,
      transportStatus: true,
      errorMessage: true,
      triggerRunId: true,
      isResend: true,
      sentToEmail: true,
    },
  });
}
