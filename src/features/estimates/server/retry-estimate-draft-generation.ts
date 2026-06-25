import { tasks } from "@trigger.dev/sdk";

import { prisma } from "@/db/client";
import { computeEstimateDraftRecoveryFlags } from "@/features/estimates/lib/estimate-generation-stale";
import { assertVersionEditable } from "@/features/estimates/server/repository";
import { resolveStoredConfigurationSnapshot } from "@/features/workspaces/lib/configuration-snapshot";
import type { Locale } from "@/lib/locale";
import type { generateEstimateDraftTask } from "@/trigger/generate-estimate-draft";

export async function retryEstimateDraftGeneration(input: {
  estimateId: string;
  workspaceId: string;
  userId: string;
  locale: Locale;
  force?: boolean;
}): Promise<void> {
  const estimate = await prisma.estimate.findFirst({
    where: { id: input.estimateId, workspaceId: input.workspaceId, deletedAt: null },
    select: {
      id: true,
      aiMetadata: true,
      estimateRequest: {
        select: { id: true, status: true, aiMetadata: true, updatedAt: true },
      },
      latestVersion: { select: { id: true, status: true } },
    },
  });

  if (!estimate?.estimateRequest || !estimate.latestVersion) {
    throw new Error("ESTIMATE_NOT_FOUND");
  }

  const sectionCount = await prisma.estimateSection.count({
    where: { versionId: estimate.latestVersion.id, deletedAt: null },
  });

  if (sectionCount > 0) {
    throw new Error("GENERATION_HAS_SECTIONS");
  }

  const { isIncompleteAiDraft, canManualRetryAiDraft } = computeEstimateDraftRecoveryFlags({
    hasEstimateRequest: true,
    status: estimate.estimateRequest.status,
    sectionCount,
    versionStatus: estimate.latestVersion.status,
    updatedAt: estimate.estimateRequest.updatedAt,
  });

  if (!isIncompleteAiDraft) {
    throw new Error("GENERATION_NOT_RETRYABLE");
  }

  if (!input.force && !canManualRetryAiDraft) {
    throw new Error("GENERATION_ACTIVE");
  }

  await assertVersionEditable(estimate.latestVersion.id, input.workspaceId);

  const priorMetadata =
    (estimate.estimateRequest.aiMetadata as Record<string, unknown> | null) ?? {};
  const priorRetryCount =
    typeof priorMetadata.retryCount === "number" ? priorMetadata.retryCount : 0;

  await prisma.estimateRequest.update({
    where: { id: estimate.estimateRequest.id },
    data: {
      status: "PROCESSING",
      aiMetadata: {
        ...priorMetadata,
        retryCount: priorRetryCount + 1,
        lastRetriedAt: new Date().toISOString(),
        lastRetriedByUserId: input.userId,
      },
    },
  });

  const configurationSnapshot = resolveStoredConfigurationSnapshot(
    estimate.aiMetadata,
    estimate.estimateRequest.aiMetadata,
  );

  await tasks.trigger<typeof generateEstimateDraftTask>("generate-estimate-draft", {
    estimateRequestId: estimate.estimateRequest.id,
    estimateId: estimate.id,
    versionId: estimate.latestVersion.id,
    workspaceId: input.workspaceId,
    locale: input.locale,
    ...(configurationSnapshot !== undefined ? { configurationSnapshot } : {}),
  });
}
