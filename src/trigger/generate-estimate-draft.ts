import { AttachmentUploadSource } from "@prisma/client";
import { task, logger } from "@trigger.dev/sdk";

import { prisma } from "@/db/client";
import {
  ESTIMATE_ACTIVITY_ACTIONS,
  logEstimateActivity,
} from "@/features/estimates/server/activity-log";
import { syncVersionTotals } from "@/features/estimates/lib/sync-version-totals";
import { getIndustryProfileVersion } from "@/ai/config/industry-ai-profiles";
import { generateEstimateDraft } from "@/ai/services/generate-estimate-draft";
import { validateGeneratedSectionTitles } from "@/ai/lib/validate-generated-section-titles";
import { buildProjectBrief } from "@/features/estimate-requests/lib/build-project-brief";
import {
  markAttachmentsPromotionFailed,
  promoteRequestAttachmentsToEstimate,
} from "@/features/attachments/server/promote-request-attachments";
import { loadEstimateGenerationContext } from "@/features/workspaces/lib/load-estimate-generation-context";
import { notifyEstimateRequestOutcome } from "@/features/notifications/server/notification-emit-helpers";
import { fireNotification } from "@/features/notifications/server/notification-workspace-context";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

interface GenerateEstimateDraftPayload {
  estimateRequestId: string;
  estimateId: string;
  versionId: string;
  workspaceId: string;
  locale: string;
  templateId?: string | null;
  priceListId?: string | null;
  uploadSource?: AttachmentUploadSource;
  uploadedById?: string | null;
}

async function runAttachmentPromotion(payload: GenerateEstimateDraftPayload): Promise<void> {
  const estimate = await prisma.estimate.findFirst({
    where: { id: payload.estimateId, workspaceId: payload.workspaceId },
    select: { id: true },
  });

  const version = await prisma.estimateVersion.findFirst({
    where: { id: payload.versionId, estimateId: payload.estimateId },
    select: { id: true },
  });

  if (!estimate || !version) {
    logger.warn("Skipping attachment promotion — estimate or version missing", {
      estimateRequestId: payload.estimateRequestId,
    });
    return;
  }

  try {
    const result = await promoteRequestAttachmentsToEstimate({
      estimateRequestId: payload.estimateRequestId,
      estimateId: payload.estimateId,
      workspaceId: payload.workspaceId,
      uploadSource: payload.uploadSource ?? AttachmentUploadSource.PUBLIC_REQUEST,
      uploadedById: payload.uploadedById ?? null,
    });

    logger.info("Attachment promotion completed", {
      estimateRequestId: payload.estimateRequestId,
      promotedCount: result.promotedCount,
      promotedImageAttachmentIds: result.promotedImageAttachmentIds,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Attachment promotion failed", {
      estimateRequestId: payload.estimateRequestId,
      error: errorMessage,
    });

    await markAttachmentsPromotionFailed({
      estimateRequestId: payload.estimateRequestId,
      errorMessage,
    });
  }
}

async function markEstimateRequestFailed(
  estimateRequestId: string,
  priorMetadata: unknown,
  errorMessage: string,
  workspaceId?: string,
): Promise<void> {
  const request = await prisma.estimateRequest.findUnique({
    where: { id: estimateRequestId },
    select: { status: true },
  });

  if (!request || request.status === "COMPLETED") {
    return;
  }

  if (request.status !== "PENDING" && request.status !== "PROCESSING") {
    return;
  }

  await prisma.estimateRequest.update({
    where: { id: estimateRequestId },
    data: {
      status: "FAILED",
      aiMetadata: {
        ...(priorMetadata as object | null ?? {}),
        failedAt: new Date().toISOString(),
        error: errorMessage,
      },
    },
  });

  if (workspaceId) {
    fireNotification(
      notifyEstimateRequestOutcome({
        requestId: estimateRequestId,
        workspaceId,
        outcome: "failed",
      }),
    );
  }
}

export const generateEstimateDraftTask = task({
  id: "generate-estimate-draft",
  maxDuration: 300,
  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  onFailure: async ({ payload, error }) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Estimate draft task failed (onFailure)", {
      estimateRequestId: payload.estimateRequestId,
      error: errorMessage,
    });

    const request = await prisma.estimateRequest.findUnique({
      where: { id: payload.estimateRequestId },
      select: { aiMetadata: true },
    });

    await markEstimateRequestFailed(
      payload.estimateRequestId,
      request?.aiMetadata,
      errorMessage,
      payload.workspaceId,
    );
  },
  onComplete: async ({ payload, result }) => {
    if (result.ok) {
      return;
    }

    const errorMessage =
      result.error instanceof Error
        ? result.error.message
        : result.error != null
          ? String(result.error)
          : "Task completed without output";

    logger.warn("Estimate draft task completed without success (onComplete)", {
      estimateRequestId: payload.estimateRequestId,
      error: errorMessage,
    });

    const request = await prisma.estimateRequest.findUnique({
      where: { id: payload.estimateRequestId },
      select: { aiMetadata: true, status: true },
    });

    if (request?.status === "PROCESSING" || request?.status === "PENDING") {
      await markEstimateRequestFailed(
        payload.estimateRequestId,
        request.aiMetadata,
        errorMessage,
        payload.workspaceId,
      );
    }
  },
  run: async (payload: GenerateEstimateDraftPayload) => {
    const { estimateRequestId, estimateId, versionId, workspaceId, locale: localeRaw } =
      payload;

    const locale: Locale = isLocale(localeRaw) ? localeRaw : "pl";

    logger.info("Estimate draft generation started", { estimateRequestId, estimateId });

    const request = await prisma.estimateRequest.findUnique({
      where: { id: estimateRequestId },
    });

    if (!request) {
      logger.error("EstimateRequest not found", { estimateRequestId });
      return;
    }

    if (request.status === "COMPLETED") {
      logger.info("Skipping — request already completed", {
        estimateRequestId,
        status: request.status,
      });
      return;
    }

    if (request.status === "FAILED") {
      const priorError =
        request.aiMetadata &&
        typeof request.aiMetadata === "object" &&
        "error" in request.aiMetadata &&
        typeof (request.aiMetadata as { error?: unknown }).error === "string"
          ? (request.aiMetadata as { error: string }).error
          : null;

      logger.warn("Skipping retry — request already failed", {
        estimateRequestId,
        status: request.status,
        priorError,
      });

      throw new Error(
        priorError ?? "Estimate request already failed; not retrying generation.",
      );
    }

    await prisma.estimateRequest.update({
      where: { id: estimateRequestId },
      data: { status: "PROCESSING" },
    });

    await runAttachmentPromotion(payload);

    try {
      logger.info("Loading estimate generation context", { estimateRequestId, workspaceId });
      const context = await loadEstimateGenerationContext(workspaceId, locale, {
        templateId: payload.templateId,
        priceListId: payload.priceListId,
      });

      if (!context) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      logger.info("Building project brief", {
        estimateRequestId,
        industry: context.industry,
        sectionCount: context.estimateSections.length,
      });
      const projectBrief = await buildProjectBrief({
        request,
        industry: context.industry,
        locale,
      });

      logger.info("Calling OpenAI for estimate draft", {
        estimateRequestId,
        projectBriefLength: projectBrief.length,
      });
      const draftOutput = await generateEstimateDraft({
        projectBrief,
        context,
      });
      logger.info("OpenAI estimate draft returned", {
        estimateRequestId,
        sectionCount: draftOutput.sections.length,
      });

      const titleValidation = validateGeneratedSectionTitles({
        generatedSections: draftOutput.sections,
        allowedSections: context.allowedSections,
      });

      if (!titleValidation.ok) {
        throw new Error(
          "AI returned an empty estimate (no sections or no line items).",
        );
      }

      if (titleValidation.warnings.length > 0) {
        logger.warn("Section title validation warnings", {
          estimateRequestId,
          warnings: titleValidation.warnings,
        });
      }

      logger.info("AI draft generated", {
        sectionCount: draftOutput.sections.length,
        suggestedMargin: draftOutput.suggestedMarginPercent,
        titleWarningCount: titleValidation.warnings.length,
      });

      const sectionTitleValidationMeta = {
        warnings: titleValidation.warnings,
        allowedTitles: titleValidation.allowedTitles,
        generatedTitles: titleValidation.generatedTitles,
      };

      await prisma.$transaction(async (tx) => {
        for (const [sIdx, section] of draftOutput.sections.entries()) {
          const createdSection = await tx.estimateSection.create({
            data: {
              workspaceId,
              versionId,
              title: section.title,
              sortOrder: section.sortOrder ?? sIdx,
            },
          });

          for (const [iIdx, item] of section.items.entries()) {
            await tx.estimateLineItem.create({
              data: {
                workspaceId,
                sectionId: createdSection.id,
                name: item.name,
                unit: item.unit ?? null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                vatRate: item.vatRate,
                sortOrder: item.sortOrder ?? iIdx,
              },
            });
          }
        }

        if (draftOutput.suggestedMarginPercent != null) {
          await tx.estimateVersion.update({
            where: { id: versionId },
            data: { marginPercent: draftOutput.suggestedMarginPercent },
          });
        }

        await tx.estimateRequest.update({
          where: { id: estimateRequestId },
          data: {
            status: "COMPLETED",
            aiMetadata: {
              ...(request.aiMetadata as object | null ?? {}),
              generatedAt: new Date().toISOString(),
              model: "gpt-4o",
              industry: context.industry,
              profileVersion: getIndustryProfileVersion(context.industry),
              sectionTitleValidation: sectionTitleValidationMeta,
              promptSectionCount: context.estimateSections.length,
              configurationSnapshot: context.configurationSnapshot,
            },
          },
        });

        await tx.estimate.update({
          where: { id: estimateId },
          data: {
            aiMetadata: {
              generatedAt: new Date().toISOString(),
              model: "gpt-4o",
              profileVersion: getIndustryProfileVersion(context.industry),
              sectionCount: draftOutput.sections.length,
              sectionTitleValidation: sectionTitleValidationMeta,
              configurationSnapshot: context.configurationSnapshot,
            },
          },
        });
      });

      await syncVersionTotals(versionId, workspaceId);

      await prisma.estimateVersion.update({
        where: { id: versionId },
        data: { updatedAt: new Date() },
      });

      logger.info("Estimate draft saved successfully", { estimateId, versionId });

      const version = await prisma.estimateVersion.findUnique({
        where: { id: versionId },
        select: { versionNumber: true },
      });

      await logEstimateActivity({
        estimateId,
        workspaceId,
        actorType: "SYSTEM",
        category: "AI",
        action: ESTIMATE_ACTIVITY_ACTIONS.ai_generated,
        metadata: { versionNumber: version?.versionNumber ?? 1 },
      });

      const { scheduleUpsertSearchDocumentForEstimate, scheduleUpsertSearchDocumentForInquiry } =
        await import("@/features/search/server/index-service");
      scheduleUpsertSearchDocumentForEstimate(estimateId);
      scheduleUpsertSearchDocumentForInquiry(estimateRequestId);

      fireNotification(
        notifyEstimateRequestOutcome({
          requestId: estimateRequestId,
          workspaceId,
          outcome: "completed",
        }),
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to generate estimate draft", {
        estimateRequestId,
        error: errorMessage,
      });

      await markEstimateRequestFailed(
        estimateRequestId,
        request.aiMetadata,
        errorMessage,
        workspaceId,
      );

      throw error;
    }
  },
});
