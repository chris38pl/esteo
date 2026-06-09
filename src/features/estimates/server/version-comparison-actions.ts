"use server";

import "server-only";

import {
  compareEstimateVersions,
  versionTreeToSnapshot,
  type VersionComparisonSummary,
} from "@/features/estimates/lib/compare-estimate-versions";
import {
  serializeVersionWithTree,
} from "@/features/estimates/lib/serialize-estimate";
import { requireAuth } from "@/server/auth/require-auth";
import { PermissionError } from "@/server/permissions/errors";
import { getEstimateForEditor, getVersionWithTree } from "./repository";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError) {
    return { success: false, error: error.message };
  }
  console.error("[version-comparison action]", error);
  return { success: false, error: "Something went wrong." };
}

export async function getVersionComparisonSummaryAction(input: {
  estimateId: string;
  workspaceId: string;
  baseVersionNumber: number;
  targetVersionNumber: number;
  locale?: "pl" | "en";
}): Promise<ActionResult<VersionComparisonSummary>> {
  try {
    await requireAuth(input.locale ?? "pl");

    const estimate = await getEstimateForEditor(input.estimateId, input.workspaceId);
    if (!estimate) {
      throw new PermissionError("Estimate not found.");
    }

    const baseVersion = estimate.versions.find(
      (version) => version.versionNumber === input.baseVersionNumber,
    );
    const targetVersion = estimate.versions.find(
      (version) => version.versionNumber === input.targetVersionNumber,
    );

    if (!baseVersion || !targetVersion) {
      throw new PermissionError("Version not found.");
    }

    const [baseTree, targetTree] = await Promise.all([
      getVersionWithTree(baseVersion.id, input.workspaceId),
      getVersionWithTree(targetVersion.id, input.workspaceId),
    ]);

    if (!baseTree || !targetTree) {
      throw new PermissionError("Version not found.");
    }

    const summary = compareEstimateVersions({
      baseSnapshot: versionTreeToSnapshot(serializeVersionWithTree(baseTree)),
      targetSnapshot: versionTreeToSnapshot(serializeVersionWithTree(targetTree)),
      baseVersionNumber: input.baseVersionNumber,
      targetVersionNumber: input.targetVersionNumber,
      baseTotalGross: Number(baseVersion.totalGross),
      targetTotalGross: Number(targetVersion.totalGross),
    });

    return { success: true, data: summary };
  } catch (error) {
    return toActionError(error);
  }
}
