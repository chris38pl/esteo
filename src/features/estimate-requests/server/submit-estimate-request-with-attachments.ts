import "server-only";

import { createId } from "@paralleldrive/cuid2";
import {
  AttachmentUploadSource,
  BusinessDocumentType,
  type Prisma,
} from "@prisma/client";
import { tasks } from "@trigger.dev/sdk";

import { prisma } from "@/db/client";
import {
  scheduleUpsertSearchDocumentForEstimate,
  scheduleUpsertSearchDocumentForInquiry,
  scheduleUpsertSearchDocumentsForRequestAttachments,
} from "@/features/search/server/index-service";
import {
  type RequestAttachmentRecord,
} from "@/features/attachments/lib/request-attachment-metadata";
import { isAttachmentUploadAvailable } from "@/features/attachments/lib/attachment-availability";
import { getPublicAttachmentAvailability } from "@/features/attachments/server/public-attachment-availability";
import { StagingAttachmentError } from "@/features/attachments/server/staging-attachment-errors";
import {
  markStagingAttachmentsLinkedInTx,
  resolveStagingAttachmentsForSubmit,
} from "@/features/attachments/server/staging-attachment-service";
import {
  collectStorageKeysFromRecords,
  deleteStorageKeys,
} from "@/features/attachments/server/upload-service";
import { decrementWorkspaceStorageUsed } from "@/features/attachments/server/usage-service";
import { buildEstimateTitleFromPublicRequest } from "@/features/estimates/lib/build-estimate-title-from-public-request";
import { notifyEstimateRequestSubmitted } from "@/features/notifications/server/notification-emit-helpers";
import { fireNotification } from "@/features/notifications/server/notification-workspace-context";
import { workspaceLocaleToAppLocale } from "@/lib/workspace-locale";
import { coerceIndustryFieldValues } from "@/features/estimate-requests/lib/coerce-industry-field-values";
import { normalizeEstimateRequestAddress } from "@/features/estimate-requests/lib/normalize-request-address";
import type { InternalEstimateCreateInput } from "@/features/estimate-requests/schemas/request";
import {
  ESTIMATE_ACTIVITY_ACTIONS,
  logEstimateActivity,
} from "@/features/estimates/server/activity-log";
import { getIndustryFieldsForDocument } from "@/features/industry-fields/server/get-fields-for-workspace";
import {
  upsertDocumentFieldValues,
  validateDocumentFieldValues,
} from "@/features/industry-fields/server/validate-document-values";
import type { Locale } from "@/lib/locale";
import { getEstimateProcessingGate } from "@/server/billing/entitlement-service";
import { recordUsageInTx } from "@/server/billing/usage-service";
import { assertCanCreateEstimate } from "@/server/permissions/entitlements";
import type { generateEstimateDraftTask } from "@/trigger/generate-estimate-draft";

export class SubmitEstimateRequestError extends Error {
  constructor(
    message: string,
    readonly code:
      | "WORKSPACE_NOT_FOUND"
      | "STORAGE_FULL"
      | "ALL_ATTACHMENTS_FAILED"
      | "VALIDATION"
      | "UNAVAILABLE"
      | "ATTACHMENTS_NOT_READY",
  ) {
    super(message);
    this.name = "SubmitEstimateRequestError";
  }
}

export type SubmitEstimateRequestResult = {
  requestId: string;
  requestNumber: string;
  estimateId: string | null;
  versionId: string | null;
  attachmentWarnings: string[];
  queued?: boolean;
};

type SharedBody = InternalEstimateCreateInput;

async function rollbackStoredRequestUploads(
  workspaceId: string,
  records: RequestAttachmentRecord[],
): Promise<void> {
  const stored = records.filter((record) => record.status === "stored");

  if (stored.length === 0) {
    return;
  }

  await deleteStorageKeys(collectStorageKeysFromRecords(stored));

  const totalBytes = stored.reduce((sum, record) => sum + record.fileSizeBytes, 0);
  await decrementWorkspaceStorageUsed(workspaceId, totalBytes);
}

async function generateRequestNumber(
  tx: Prisma.TransactionClient,
  workspaceId: string,
): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `ER-${year}-`;

  const count = await tx.estimateRequest.count({
    where: {
      workspaceId,
      requestNumber: { startsWith: prefix },
    },
  });

  return `${prefix}${String(count + 1).padStart(5, "0")}`;
}

async function resolveWorkspaceForInternal(workspaceId: string) {
  return prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    select: { id: true, industry: true, name: true, slug: true, defaultLocale: true },
  });
}

async function validateIndustryFields(input: {
  workspaceId: string;
  industry: Prisma.WorkspaceGetPayload<{ select: { industry: true } }>["industry"];
  locale: Locale;
  industryFields: SharedBody["industryFields"];
  intakeSurface: "public" | "internal";
}) {
  const fields = await getIndustryFieldsForDocument({
    workspaceId: input.workspaceId,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    locale: input.locale,
    intakeSurface: input.intakeSurface,
  });

  const fieldKeys = fields.map((field) => field.key);
  const intakeKeySet = new Set(fieldKeys);

  const coercedValues = coerceIndustryFieldValues({
    fields,
    values: input.industryFields,
  });

  const dynamicValues = Object.fromEntries(
    Object.entries(coercedValues).filter(([key]) => intakeKeySet.has(key)),
  );

  await validateDocumentFieldValues({
    industry: input.industry,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    values: dynamicValues,
    fieldKeys,
  });

  return { fields, dynamicValues, fieldKeys };
}

export async function submitEstimateRequestWithAttachments(input: {
  locale: Locale;
  source: Extract<AttachmentUploadSource, "PUBLIC_REQUEST" | "INTERNAL_REQUEST">;
  body: SharedBody;
  attachmentIds?: string[];
  workspaceSlug?: string;
  workspaceId?: string;
  requestMeta?: { ip: string; userAgent: string };
  uploadedById?: string | null;
  userId?: string;
  explicitTitle?: string;
  voiceIntakeMetadata?: Record<string, unknown>;
}): Promise<SubmitEstimateRequestResult> {
  const attachmentWarnings: string[] = [];
  const attachmentIds = input.attachmentIds ?? [];

  const workspace =
    input.source === AttachmentUploadSource.PUBLIC_REQUEST
      ? input.workspaceSlug
        ? await prisma.workspace.findFirst({
            where: { slug: input.workspaceSlug, deletedAt: null },
            select: { id: true, industry: true, name: true, slug: true, defaultLocale: true },
          })
        : null
      : input.workspaceId
        ? await resolveWorkspaceForInternal(input.workspaceId)
        : null;

  if (!workspace) {
    throw new SubmitEstimateRequestError("Workspace not found.", "WORKSPACE_NOT_FOUND");
  }

  if (input.source === AttachmentUploadSource.INTERNAL_REQUEST && input.userId) {
    await assertCanCreateEstimate(workspace.id);
  }

  const processingGate =
    input.source === AttachmentUploadSource.PUBLIC_REQUEST
      ? await getEstimateProcessingGate(workspace.id)
      : ({ allowed: true } as const);

  const runFullPipeline = processingGate.allowed;

  const { dynamicValues, fieldKeys } = await validateIndustryFields({
    workspaceId: workspace.id,
    industry: workspace.industry,
    locale: input.locale,
    industryFields: input.body.industryFields,
    intakeSurface: input.source === "INTERNAL_REQUEST" ? "internal" : "public",
  });

  if (attachmentIds.length > 0) {
    const availability = await getPublicAttachmentAvailability(workspace.id);

    if (!isAttachmentUploadAvailable(availability)) {
      throw new SubmitEstimateRequestError(
        "Attachment storage is unavailable.",
        "STORAGE_FULL",
      );
    }
  }

  const voiceGeneratedTitle =
    typeof input.voiceIntakeMetadata?.generatedTitle === "string"
      ? input.voiceIntakeMetadata.generatedTitle.trim()
      : "";
  const voiceTitleConfidence =
    typeof input.voiceIntakeMetadata?.overallConfidence === "number"
      ? input.voiceIntakeMetadata.overallConfidence
      : 0;

  const normalizedAddress = normalizeEstimateRequestAddress(
    workspace.industry,
    input.body.address,
  );

  const estimateTitle =
    input.explicitTitle?.trim() ||
    (voiceGeneratedTitle && voiceTitleConfidence >= 0.75
      ? voiceGeneratedTitle.slice(0, 60)
      : null) ||
    buildEstimateTitleFromPublicRequest({
      industry: workspace.industry,
      fullName: input.body.customer.fullName,
      address: normalizedAddress,
      industryFieldValues: dynamicValues,
      locale: input.locale,
    });

  const estimateId = runFullPipeline ? createId() : null;
  const versionId = runFullPipeline ? createId() : null;
  const requestId = createId();

  let attachmentRecords: RequestAttachmentRecord[] = [];

  const baseAiMetadata: Record<string, unknown> =
    input.source === AttachmentUploadSource.PUBLIC_REQUEST
      ? {
          source: "public_estimate_request_form",
          locale: input.locale,
          security: input.requestMeta,
        }
      : {
          source: "internal_dashboard",
          createdByUserId: input.userId,
        };

  if (attachmentIds.length > 0) {
    baseAiMetadata.attachmentsPromotionStatus = "PENDING";
  }

  if (input.voiceIntakeMetadata) {
    baseAiMetadata.voiceIntake = input.voiceIntakeMetadata;
  }

  if (!runFullPipeline) {
    baseAiMetadata.processingMode = "queued_for_manual";
  }

  const requestCustomerData = {
    fullName: input.body.customer.fullName,
    email: input.body.customer.email,
    phone: input.body.customer.phone,
    project: {
      preferredStartDate: input.body.project.preferredStartDate,
    },
  };

  try {
    const requestNumber = await prisma.$transaction(async (tx) => {
      attachmentRecords = await resolveStagingAttachmentsForSubmit(tx, {
        workspaceId: workspace.id,
        uploadSource: input.source,
        attachmentIds,
        uploadedById: input.uploadedById ?? null,
      });

      const generatedRequestNumber = await generateRequestNumber(tx, workspace.id);

      if (runFullPipeline && estimateId && versionId) {
        await tx.estimate.create({
          data: {
            id: estimateId,
            workspaceId: workspace.id,
            title: estimateTitle,
            latestVersionId: null,
          },
        });

        await tx.estimateVersion.create({
          data: {
            id: versionId,
            estimateId,
            workspaceId: workspace.id,
            versionNumber: 1,
            status: "DRAFT",
            marginPercent: 0,
            createdByUserId:
              input.source === AttachmentUploadSource.INTERNAL_REQUEST
                ? input.userId ?? null
                : null,
          },
        });

        await tx.estimate.update({
          where: { id: estimateId },
          data: { latestVersionId: versionId },
        });

        await recordUsageInTx(tx, {
          workspaceId: workspace.id,
          userId:
            input.source === AttachmentUploadSource.INTERNAL_REQUEST
              ? input.userId
              : null,
          meter: "ESTIMATE_CREATED",
        });
      }

      await tx.estimateRequest.create({
        data: {
          id: requestId,
          workspaceId: workspace.id,
          requestNumber: generatedRequestNumber,
          estimateId: runFullPipeline ? estimateId : null,
          customerData: requestCustomerData,
          address: normalizedAddress,
          projectDescription: input.body.project.description,
          attachments: attachmentRecords as unknown as Prisma.InputJsonValue,
          aiMetadata: baseAiMetadata as Prisma.InputJsonValue,
        },
      });

      await markStagingAttachmentsLinkedInTx(tx, {
        attachmentIds,
        estimateRequestId: requestId,
      });

      return generatedRequestNumber;
    });

    if (Object.keys(dynamicValues).length > 0) {
      await upsertDocumentFieldValues({
        workspaceId: workspace.id,
        industry: workspace.industry,
        documentType: BusinessDocumentType.ESTIMATE_REQUEST,
        documentId: requestId,
        values: dynamicValues,
        fieldKeys,
      });
    }

    if (runFullPipeline && estimateId && versionId) {
      await tasks.trigger<typeof generateEstimateDraftTask>("generate-estimate-draft", {
        estimateRequestId: requestId,
        estimateId,
        versionId,
        workspaceId: workspace.id,
        locale: input.locale,
        uploadSource: input.source,
        uploadedById: input.uploadedById ?? null,
      });

      await logEstimateActivity({
        estimateId,
        workspaceId: workspace.id,
        actorType:
          input.source === AttachmentUploadSource.INTERNAL_REQUEST ? "USER" : "SYSTEM",
        actorUserId:
          input.source === AttachmentUploadSource.INTERNAL_REQUEST ? input.userId : undefined,
        category: "ESTIMATE",
        action: ESTIMATE_ACTIVITY_ACTIONS.estimate_created,
        metadata: {
          source:
            input.source === AttachmentUploadSource.PUBLIC_REQUEST
              ? "public_request"
              : "manual",
        },
      });
    }

    scheduleUpsertSearchDocumentForInquiry(requestId);
    scheduleUpsertSearchDocumentsForRequestAttachments(requestId);
    if (estimateId) {
      scheduleUpsertSearchDocumentForEstimate(estimateId);
    }

    fireNotification(
      notifyEstimateRequestSubmitted({
        locale: workspaceLocaleToAppLocale(workspace.defaultLocale),
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
        workspaceName: workspace.name,
        requestId,
        requestTitle: estimateTitle,
        queuedManual: !runFullPipeline,
      }),
    );

    return {
      requestId,
      requestNumber,
      estimateId,
      versionId,
      attachmentWarnings,
      queued: !runFullPipeline,
    };
  } catch (error) {
    if (error instanceof StagingAttachmentError) {
      throw new SubmitEstimateRequestError(
        error.message,
        error.code === "EXPIRED" || error.code === "INVALID_STATUS"
          ? "ATTACHMENTS_NOT_READY"
          : "VALIDATION",
      );
    }

    await rollbackStoredRequestUploads(workspace.id, attachmentRecords);
    throw error;
  }
}
