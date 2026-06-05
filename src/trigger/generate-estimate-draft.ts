import { task, logger } from "@trigger.dev/sdk";

import { prisma } from "@/db/client";
import { syncVersionTotals } from "@/features/estimates/lib/sync-version-totals";
import { generateEstimateDraft } from "@/ai/services/generate-estimate-draft";
import { validateGeneratedSectionTitles } from "@/ai/lib/validate-generated-section-titles";
import { buildProjectBrief } from "@/features/estimate-requests/lib/build-project-brief";
import { loadEstimateGenerationContext } from "@/features/workspaces/lib/load-estimate-generation-context";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

interface GenerateEstimateDraftPayload {
  estimateRequestId: string;
  estimateId: string;
  versionId: string;
  workspaceId: string;
  locale: string;
}

async function markEstimateRequestFailed(
  estimateRequestId: string,
  priorMetadata: unknown,
  errorMessage: string,
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

    if (request.status === "COMPLETED" || request.status === "FAILED") {
      logger.info("Skipping — request already processed", {
        estimateRequestId,
        status: request.status,
      });
      return;
    }

    await prisma.estimateRequest.update({
      where: { id: estimateRequestId },
      data: { status: "PROCESSING" },
    });

    try {
      logger.info("Loading estimate generation context", { estimateRequestId, workspaceId });
      const context = await loadEstimateGenerationContext(workspaceId, locale);

      if (!context) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      logger.info("Building project brief", {
        estimateRequestId,
        industry: context.industry,
        sectionCount: context.estimateSections.length,
      });
      const projectBrief = await buildProjectBrief({ request, locale });

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
              sectionTitleValidation: sectionTitleValidationMeta,
              promptSectionCount: context.estimateSections.length,
            },
          },
        });

        await tx.estimate.update({
          where: { id: estimateId },
          data: {
            aiMetadata: {
              generatedAt: new Date().toISOString(),
              model: "gpt-4o",
              sectionCount: draftOutput.sections.length,
              sectionTitleValidation: sectionTitleValidationMeta,
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
      );

      throw error;
    }
  },
});
