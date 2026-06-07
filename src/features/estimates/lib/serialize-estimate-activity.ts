import type { EstimateActivityCategory } from "@prisma/client";

import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import type { ActivityMetadata } from "@/features/estimates/lib/estimate-activity-types";
import type { EstimateActivityLogRow } from "@/features/estimates/server/activity-log-repository";

export type EstimateActivityActorClient = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  avatarPreset: AvatarPreset | null;
};

export type EstimateActivityLogClient = {
  id: string;
  actorType: "USER" | "SYSTEM";
  category: EstimateActivityCategory;
  action: string;
  metadata: ActivityMetadata;
  occurredAt: string;
  actor: EstimateActivityActorClient | null;
};

function serializeActor(
  actor: EstimateActivityLogRow["actor"],
): EstimateActivityActorClient | null {
  if (!actor) return null;
  return {
    id: actor.id,
    name: actor.name,
    email: actor.email,
    avatarUrl: actor.avatarUrl,
    avatarPreset: isAvatarPreset(actor.avatarPreset) ? actor.avatarPreset : null,
  };
}

function parseMetadata(value: EstimateActivityLogRow["metadata"]): ActivityMetadata {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as ActivityMetadata;
}

export function serializeEstimateActivityLogs(
  rows: EstimateActivityLogRow[],
): EstimateActivityLogClient[] {
  return rows.map((row) => ({
    id: row.id,
    actorType: row.actorType,
    category: row.category,
    action: row.action,
    metadata: parseMetadata(row.metadata),
    occurredAt: row.occurredAt.toISOString(),
    actor: serializeActor(row.actor),
  }));
}
