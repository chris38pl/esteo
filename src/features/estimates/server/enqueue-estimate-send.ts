import "server-only";

import { createId } from "@paralleldrive/cuid2";
import { tasks } from "@trigger.dev/sdk";

import { prisma } from "@/db/client";
import { buildEstimateEmailSubject } from "@/emails/build-estimate-email-subject";
import { findActiveSendAttempt } from "@/features/estimates/server/get-estimate-send-attempts";
import { assertEstimateInWorkspace } from "@/features/estimates/server/notes-repository";
import {
  resolveDeliveryEmail,
  resolveReplyToEmail,
} from "@/server/email/resend-client";
import { PermissionError } from "@/server/permissions/errors";
import type { sendEstimateToCustomerTask } from "@/trigger/send-estimate-to-customer";

export async function enqueueEstimateSend(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  userId: string;
  userEmail: string;
  sentToEmail: string;
  attachPdf: boolean;
  isResend: boolean;
  activityNote?: string;
}): Promise<{ sendId: string; runId: string }> {
  await assertEstimateInWorkspace(input.estimateId, input.workspaceId);

  const version = await prisma.estimateVersion.findFirst({
    where: {
      id: input.versionId,
      estimateId: input.estimateId,
      workspaceId: input.workspaceId,
    },
    select: {
      id: true,
      status: true,
      archivedAt: true,
      versionNumber: true,
      estimate: {
        select: {
          title: true,
          estimateRequest: { select: { requestNumber: true } },
          workspace: {
            select: {
              settings: { select: { companyEmail: true } },
            },
          },
        },
      },
      sections: {
        where: { deletedAt: null },
        select: {
          lineItems: {
            where: { deletedAt: null },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!version) {
    throw new PermissionError("Estimate version not found.");
  }

  if (version.archivedAt) {
    throw new PermissionError("Archived versions cannot be sent.");
  }

  if (input.isResend) {
    if (version.status !== "SENT") {
      throw new PermissionError("Only sent versions can be resent.");
    }
  } else if (version.status !== "DRAFT") {
    throw new PermissionError("Only draft versions can be sent for the first time.");
  }

  const hasLineItem = version.sections.some((section) => section.lineItems.length > 0);
  if (!hasLineItem) {
    throw new PermissionError("Add at least one line item before sending.");
  }

  const email = input.sentToEmail.trim();
  if (!email) {
    throw new PermissionError("Recipient email is required.");
  }

  const activeSend = await findActiveSendAttempt(input.versionId);
  if (activeSend) {
    throw new PermissionError("A send is already in progress.");
  }

  const estimateName =
    version.estimate.title?.trim() ||
    version.estimate.estimateRequest?.requestNumber ||
    `Wycena v${version.versionNumber}`;

  const replyToEmail = resolveReplyToEmail({
    companyEmail: version.estimate.workspace.settings?.companyEmail,
    sendingUserEmail: input.userEmail,
  });

  const sendId = createId();
  const emailSubject = buildEstimateEmailSubject(estimateName);

  await prisma.estimateVersionSend.create({
    data: {
      id: sendId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      sentToEmail: email,
      deliveredToEmail: resolveDeliveryEmail(email),
      replyToEmail,
      sentByUserId: input.userId,
      emailSubject,
      attachPdf: input.attachPdf,
      isResend: input.isResend,
    },
  });

  const handle = await tasks.trigger<typeof sendEstimateToCustomerTask>(
    "send-estimate-to-customer",
    {
      sendId,
      activityNote: input.activityNote,
    },
  );

  await prisma.estimateVersionSend.update({
    where: { id: sendId },
    data: { triggerRunId: handle.id },
  });

  return { sendId, runId: handle.id };
}
