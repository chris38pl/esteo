import type { EstimateRequestStatus } from "@prisma/client";

import {
  isIncompleteAiDraft,
  type EstimateDraftRecoveryInput,
} from "@/features/estimates/lib/is-incomplete-ai-draft";

export const ESTIMATE_GENERATION_STALE_MS = 3 * 60 * 1000;

export function isEstimateGenerationStale(input: {
  status: EstimateRequestStatus | null | undefined;
  sectionCount: number;
  updatedAt: Date;
  now?: Date;
}): boolean {
  if (input.sectionCount > 0) {
    return false;
  }

  if (input.status !== "PENDING" && input.status !== "PROCESSING") {
    return false;
  }

  const now = input.now ?? new Date();
  return now.getTime() - input.updatedAt.getTime() > ESTIMATE_GENERATION_STALE_MS;
}

export function canManualRetryAiDraft(input: EstimateDraftRecoveryInput): boolean {
  const incomplete = isIncompleteAiDraft({
    hasEstimateRequest: input.hasEstimateRequest,
    sectionCount: input.sectionCount,
    versionStatus: input.versionStatus,
  });

  if (!incomplete) {
    return false;
  }

  if (input.status === "FAILED") {
    return true;
  }

  if (input.status === "COMPLETED") {
    return true;
  }

  if (isEstimateGenerationStale(input)) {
    return true;
  }

  return false;
}

export function computeEstimateDraftRecoveryFlags(input: EstimateDraftRecoveryInput): {
  isIncompleteAiDraft: boolean;
  canManualRetryAiDraft: boolean;
  isStale: boolean;
} {
  const incomplete = isIncompleteAiDraft({
    hasEstimateRequest: input.hasEstimateRequest,
    sectionCount: input.sectionCount,
    versionStatus: input.versionStatus,
  });

  const stale = isEstimateGenerationStale(input);

  return {
    isIncompleteAiDraft: incomplete,
    canManualRetryAiDraft: canManualRetryAiDraft(input),
    isStale: stale,
  };
}
