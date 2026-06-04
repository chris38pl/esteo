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

export const generateEstimateDraftTask = task({
  id: "generate-estimate-draft",
  maxDuration: 300,
  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: GenerateEstimateDraftPayload) => {
    const { estimateRequestId, estimateId, versionId, workspaceId, locale: localeRaw } =
      payload;

    const locale: Locale = isLocale(localeRaw) ? localeRaw : "pl";

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
      const context = await loadEstimateGenerationContext(workspaceId, locale);

      if (!context) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      const projectBrief = await buildProjectBrief({ request, locale });

      const draftOutput = await generateEstimateDraft({
        projectBrief,
        context,
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

      logger.info("Estimate draft saved successfully", { estimateId, versionId });
    } catch (error) {
      logger.error("Failed to generate estimate draft", {
        estimateRequestId,
        error: error instanceof Error ? error.message : String(error),
      });

      await prisma.estimateRequest.update({
        where: { id: estimateRequestId },
        data: {
          status: "FAILED",
          aiMetadata: {
            ...(request.aiMetadata as object | null ?? {}),
            failedAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error),
          },
        },
      });

      throw error;
    }
  },
});
