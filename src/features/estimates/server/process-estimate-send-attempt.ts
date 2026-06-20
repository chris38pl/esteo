import "server-only";

import { EstimateSendTransportStatus } from "@prisma/client";
import { format } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { render } from "react-email";

import { prisma } from "@/db/client";
import { getStorageProvider } from "@/features/attachments/server/storage";
import { buildEstimateEmailSubject } from "@/emails/build-estimate-email-subject";
import { EstimateSendEmail } from "@/emails/estimate-send-email";
import { ESTIMATE_ACTIVITY_ACTIONS, logEstimateActivity } from "@/features/estimates/server/activity-log";
import { findEstimatePdfByVersionId } from "@/features/estimates/server/estimate-pdf-repository";
import { buildEstimatePdfDisplayFileName } from "@/features/estimates/lib/estimate-pdf-filename";
import { generateAndStoreEstimatePdf } from "@/features/estimates/server/generate-and-store-estimate-pdf";
import type { Locale } from "@/lib/locale";
import {
  buildDevEmailSubject,
  getEmailFromAddress,
  getResend,
  resolveDeliveryEmail,
} from "@/server/email/resend-client";

function toDateLocale(locale: Locale) {
  return locale === "en" ? enUS : pl;
}

export async function updateSendTransportStatus(
  sendId: string,
  transportStatus: EstimateSendTransportStatus,
  extra?: {
    errorMessage?: string | null;
    sentAt?: Date;
    resendMessageId?: string;
    emailHtml?: string;
    estimatePdfId?: string | null;
    deliveredToEmail?: string;
  },
): Promise<void> {
  await prisma.estimateVersionSend.update({
    where: { id: sendId },
    data: {
      transportStatus,
      errorMessage: extra?.errorMessage ?? undefined,
      sentAt: extra?.sentAt,
      resendMessageId: extra?.resendMessageId,
      emailHtml: extra?.emailHtml,
      estimatePdfId: extra?.estimatePdfId ?? undefined,
      deliveredToEmail: extra?.deliveredToEmail,
    },
  });
}

export async function processEstimateSendAttempt(
  sendId: string,
  activityNote?: string,
): Promise<void> {
  const send = await prisma.estimateVersionSend.findUnique({
    where: { id: sendId },
    include: {
      version: {
        select: {
          id: true,
          estimateId: true,
          workspaceId: true,
          versionNumber: true,
          status: true,
          estimate: {
            select: {
              id: true,
              title: true,
              estimateRequest: {
                select: {
                  requestNumber: true,
                  customerData: true,
                },
              },
              workspace: {
                select: {
                  name: true,
                  defaultLocale: true,
                  settings: {
                    select: { companyEmail: true },
                  },
                },
              },
            },
          },
        },
      },
      sentBy: {
        select: { id: true, email: true },
      },
    },
  });

  if (!send) {
    throw new Error("Send attempt not found.");
  }

  const locale = (send.version.estimate.workspace.defaultLocale === "EN" ? "en" : "pl") as Locale;
  const estimateName =
    send.version.estimate.title?.trim() ||
    send.version.estimate.estimateRequest?.requestNumber ||
    `Wycena v${send.version.versionNumber}`;
  const customerData = send.version.estimate.estimateRequest?.customerData as
    | { fullName?: string }
    | null
    | undefined;

  try {
    await updateSendTransportStatus(sendId, "GENERATING_PDF");

    let estimatePdfId: string | null = null;
    let pdfBuffer: Buffer | null = null;
    let generatedAtLabel = format(new Date(), "d MMMM yyyy", { locale: toDateLocale(locale) });

    if (send.attachPdf) {
      const pdfResult = await generateAndStoreEstimatePdf({
        estimateId: send.version.estimateId,
        versionId: send.version.id,
        workspaceId: send.workspaceId,
        locale,
        userId: send.sentByUserId,
      });

      estimatePdfId = pdfResult.estimatePdfId;
      const pdfRecord = await findEstimatePdfByVersionId(send.version.id);

      if (!pdfRecord?.fileKey) {
        throw new Error("PDF generation did not produce a file.");
      }

      generatedAtLabel = format(pdfRecord.generatedAt, "d MMMM yyyy", {
        locale: toDateLocale(locale),
      });

      pdfBuffer = await getStorageProvider().download(pdfRecord.fileKey);
    }

    await updateSendTransportStatus(sendId, "SENDING");

    const html = await render(
      EstimateSendEmail({
        estimateName,
        customerName: customerData?.fullName,
        companyName: send.version.estimate.workspace.name,
        estimateNumber: send.version.estimate.estimateRequest?.requestNumber,
        generatedAt: generatedAtLabel,
      }),
    );

    const subject = buildDevEmailSubject(
      send.sentToEmail,
      buildEstimateEmailSubject(estimateName),
    );

    const deliveredToEmail = resolveDeliveryEmail(send.sentToEmail);

    const replyTo =
      send.replyToEmail ||
      send.version.estimate.workspace.settings?.companyEmail?.trim() ||
      send.sentBy.email;

    const attachments =
      send.attachPdf && pdfBuffer
        ? [
            {
              filename: buildEstimatePdfDisplayFileName({
                requestNumber: send.version.estimate.estimateRequest?.requestNumber,
                estimateId: send.version.estimateId,
                versionNumber: send.version.versionNumber,
                locale,
              }),
              content: pdfBuffer,
            },
          ]
        : undefined;

    const result = await getResend().emails.send({
      from: getEmailFromAddress(),
      to: deliveredToEmail,
      replyTo,
      subject,
      html,
      attachments,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    const sentAt = new Date();
    const resendMessageId = result.data?.id ?? null;

    await prisma.$transaction(async (tx) => {
      await tx.estimateVersionSend.update({
        where: { id: sendId },
        data: {
          transportStatus: "PROVIDER_ACCEPTED",
          sentAt,
          resendMessageId,
          emailHtml: html,
          estimatePdfId,
          deliveredToEmail,
          errorMessage: null,
        },
      });

      const versionUpdate: {
        lastSentAt: Date;
        lastSentToEmail: string;
        lastSentByUserId: string;
        status?: "SENT";
        statusChangedAt?: Date;
      } = {
        lastSentAt: sentAt,
        lastSentToEmail: send.sentToEmail,
        lastSentByUserId: send.sentByUserId,
      };

      if (send.version.status === "DRAFT") {
        versionUpdate.status = "SENT";
        versionUpdate.statusChangedAt = sentAt;
      }

      await tx.estimateVersion.update({
        where: { id: send.version.id },
        data: versionUpdate,
      });
    });

    const pdfFileName =
      send.attachPdf && pdfBuffer
        ? buildEstimatePdfDisplayFileName({
            requestNumber: send.version.estimate.estimateRequest?.requestNumber,
            estimateId: send.version.estimateId,
            versionNumber: send.version.versionNumber,
            locale,
          })
        : undefined;

    await logEstimateActivity({
      estimateId: send.version.estimateId,
      workspaceId: send.workspaceId,
      actorType: "USER",
      actorUserId: send.sentByUserId,
      category: "SHARING",
      action: send.isResend
        ? ESTIMATE_ACTIVITY_ACTIONS.estimate_resent
        : ESTIMATE_ACTIVITY_ACTIONS.sent_to_customer,
      metadata: {
        versionNumber: send.version.versionNumber,
        email: send.sentToEmail,
        pdfFileName,
        sendId: send.id,
        resend: send.isResend,
        reason: activityNote,
        note: activityNote,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed.";
    await updateSendTransportStatus(sendId, "FAILED", { errorMessage: message });
    throw error;
  }
}
