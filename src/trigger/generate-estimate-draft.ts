import { task, logger } from "@trigger.dev/sdk";

import { prisma } from "@/db/client";
import { generateEstimateDraft } from "@/ai/services/generate-estimate-draft";

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
    const { estimateRequestId, estimateId, versionId, workspaceId, locale } = payload;

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
      const workspaceData = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          settings: true,
          rules: {
            where: { active: true, deletedAt: null },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (!workspaceData) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      const estimateSectionConfigs = await prisma.workspaceRule.findMany({
        where: {
          workspaceId,
          type: "ESTIMATE",
          active: true,
          deletedAt: null,
        },
        orderBy: { sortOrder: "asc" },
        select: { title: true, content: true },
      });

      const draftOutput = await generateEstimateDraft({
        projectDescription: request.projectDescription,
        companyDescription: workspaceData.settings?.companyDescription,
        aiInstructions: workspaceData.settings?.aiInstructions,
        rules: workspaceData.rules.map((r) => ({ title: r.title, content: r.content })),
        estimateSections: estimateSectionConfigs.map((s) => ({
          title: s.title,
          rule: s.content,
        })),
        locale,
      });

      logger.info("AI draft generated", {
        sectionCount: draftOutput.sections.length,
        suggestedMargin: draftOutput.suggestedMarginPercent,
      });

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
            },
          },
        });
      });

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
