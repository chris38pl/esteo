import "server-only";

import { EstimatePdfStatus, EstimateSendTransportStatus } from "@prisma/client";
import type { WorkspaceIndustry } from "@prisma/client";

import { prisma } from "@/db/client";
import {
  ACTIVATION_STEP_IDS,
  type ActivationGuideMode,
  type ActivationProgressClient,
  type ActivationStepId,
} from "@/features/activation/lib/activation-types";

const PUBLIC_FORM_SOURCE = "public_estimate_request_form";

const TERMINAL_SEND_STATUSES: EstimateSendTransportStatus[] = [
  "PROVIDER_ACCEPTED",
  "DELIVERED",
];

type ActivationProgressInput = {
  workspaceId: string;
  ownerId: string;
  userId: string;
  industry: WorkspaceIndustry;
};

async function workspaceHasReadyPdf(workspaceId: string): Promise<boolean> {
  const count = await prisma.estimatePdf.count({
    where: {
      status: EstimatePdfStatus.READY,
      estimate: { workspaceId, deletedAt: null },
    },
  });
  return count > 0;
}

async function workspaceHasPublicFormSubmission(workspaceId: string): Promise<boolean> {
  const requests = await prisma.estimateRequest.findMany({
    where: { workspaceId, deletedAt: null },
    select: { aiMetadata: true },
    take: 200,
  });

  return requests.some((request) => {
    if (request.aiMetadata == null || typeof request.aiMetadata !== "object") {
      return false;
    }
    const meta = request.aiMetadata as Record<string, unknown>;
    return meta.source === PUBLIC_FORM_SOURCE;
  });
}

async function getLatestEstimateId(workspaceId: string): Promise<string | null> {
  const estimate = await prisma.estimate.findFirst({
    where: { workspaceId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  return estimate?.id ?? null;
}

export async function getActivationProgress(
  input: ActivationProgressInput,
): Promise<ActivationProgressClient> {
  const eligible = input.userId === input.ownerId;

  if (!eligible) {
    return {
      eligible: false,
      showFormBadge: false,
      guideMode: "how_it_works",
      industry: input.industry,
      latestEstimateId: null,
      hasPublicFormSubmission: false,
      steps: ACTIVATION_STEP_IDS.map((id) => ({ id, completed: false })),
      completedCount: 0,
      totalCount: ACTIVATION_STEP_IDS.length,
    };
  }

  const [estimateCount, hasReadyPdf, hasPublicFormSubmission, latestEstimateId] =
    await Promise.all([
      prisma.estimate.count({
        where: { workspaceId: input.workspaceId, deletedAt: null },
      }),
      workspaceHasReadyPdf(input.workspaceId),
      workspaceHasPublicFormSubmission(input.workspaceId),
      getLatestEstimateId(input.workspaceId),
    ]);

  const serverSteps: Record<ActivationStepId, boolean> = {
    create_estimate: estimateCount > 0,
    generate_pdf: hasReadyPdf,
    share_form: false,
  };

  const serverCompletedCount = Object.values(serverSteps).filter(Boolean).length;

  const guideMode: ActivationGuideMode =
    serverCompletedCount >= ACTIVATION_STEP_IDS.length ? "tips" : "how_it_works";

  return {
    eligible: true,
    showFormBadge: !hasPublicFormSubmission,
    guideMode,
    industry: input.industry,
    latestEstimateId,
    hasPublicFormSubmission,
    steps: ACTIVATION_STEP_IDS.map((id) => ({
      id,
      completed: serverSteps[id],
    })),
    completedCount: serverCompletedCount,
    totalCount: ACTIVATION_STEP_IDS.length,
  };
}

export async function countCompletedAiGenerationsInWorkspace(
  workspaceId: string,
): Promise<number> {
  return prisma.estimateRequest.count({
    where: {
      workspaceId,
      deletedAt: null,
      status: "COMPLETED",
    },
  });
}

export async function workspaceHasSuccessfulSend(workspaceId: string): Promise<boolean> {
  const count = await prisma.estimateVersionSend.count({
    where: {
      transportStatus: { in: TERMINAL_SEND_STATUSES },
      version: { workspaceId, estimate: { deletedAt: null } },
    },
  });
  return count > 0;
}
