import "server-only";

import type { EstimateActivityActorType, EstimateActivityCategory } from "@prisma/client";

import {
  ESTIMATE_ACTIVITY_ACTIONS,
  type ActivityMetadata,
  type EstimateActivityAction,
} from "@/features/estimates/lib/estimate-activity-types";

import {
  coalesceOrCreateActivity,
  createActivityLog,
  type ActivityMetadataRecord,
} from "./activity-log-repository";

export { ESTIMATE_ACTIVITY_ACTIONS, type ActivityMetadata, type EstimateActivityAction };

export type LogEstimateActivityInput = {
  estimateId: string;
  workspaceId: string;
  actorType: EstimateActivityActorType;
  actorUserId?: string | null;
  category: EstimateActivityCategory;
  action: EstimateActivityAction;
  metadata?: ActivityMetadata;
};

const COALESCED_ACTIONS = new Set<EstimateActivityAction>([
  ESTIMATE_ACTIVITY_ACTIONS.version_modified,
  ESTIMATE_ACTIVITY_ACTIONS.margin_changed,
  ESTIMATE_ACTIVITY_ACTIONS.payment_installment_reordered,
]);

function matchMetadataKeysForAction(
  action: EstimateActivityAction,
): (keyof ActivityMetadataRecord)[] {
  if (action === ESTIMATE_ACTIVITY_ACTIONS.version_modified) {
    return ["versionNumber", "source"];
  }
  if (action === ESTIMATE_ACTIVITY_ACTIONS.margin_changed) {
    return ["versionNumber"];
  }
  if (action === ESTIMATE_ACTIVITY_ACTIONS.payment_installment_reordered) {
    return ["installmentCount"];
  }
  return [];
}

function mergeMetadataForAction(
  action: EstimateActivityAction,
  existing: ActivityMetadataRecord,
  incoming: ActivityMetadataRecord,
): ActivityMetadataRecord {
  if (action === ESTIMATE_ACTIVITY_ACTIONS.margin_changed) {
    return {
      ...existing,
      ...incoming,
      oldMargin: existing.oldMargin ?? incoming.oldMargin,
      newMargin: incoming.newMargin ?? existing.newMargin,
    };
  }
  return { ...existing, ...incoming };
}

/**
 * Deferred: log version_modified when a high-level saveVersionContent service
 * persists the full estimate tree. Manual cell/row edits are intentionally not
 * logged per-operation in v1.
 */
export async function recordVersionContentSaved(_input: {
  estimateId: string;
  workspaceId: string;
  userId: string;
  versionNumber: number;
  source?: "manual" | "price_list";
}): Promise<void> {
  // Wire logEstimateActivity({ action: version_modified, ... }) when bulk save ships.
}

export async function logEstimateActivity(input: LogEstimateActivityInput): Promise<void> {
  try {
    const actorUserId =
      input.actorType === "USER" ? (input.actorUserId ?? null) : null;

    if (input.actorType === "USER" && !actorUserId) {
      console.error("[estimate activity] USER actor requires actorUserId", input.action);
      return;
    }

    const metadata: ActivityMetadataRecord = input.metadata ?? {};

    if (COALESCED_ACTIONS.has(input.action)) {
      await coalesceOrCreateActivity({
        estimateId: input.estimateId,
        workspaceId: input.workspaceId,
        actorType: input.actorType,
        actorUserId,
        category: input.category,
        action: input.action,
        metadata,
        matchMetadataKeys: matchMetadataKeysForAction(input.action),
        mergeMetadata: (existing, incoming) =>
          mergeMetadataForAction(input.action, existing, incoming),
      });
      return;
    }

    await createActivityLog({
      estimateId: input.estimateId,
      workspaceId: input.workspaceId,
      actorType: input.actorType,
      actorUserId,
      category: input.category,
      action: input.action,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });
  } catch (error) {
    console.error("[estimate activity]", error);
  }
}
