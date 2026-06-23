import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import type {
  IssueActivityActorType,
  IssueActivityMetadata,
} from "@/features/issues/lib/issue-activity-types";
import type { IssueActivityLogRow } from "@/features/issues/server/activity-repository";

export type IssueActivityActorClient = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  avatarPreset: AvatarPreset | null;
};

export type IssueActivityLogClient = {
  id: string;
  actorType: IssueActivityActorType;
  action: string;
  metadata: IssueActivityMetadata;
  occurredAt: string;
  actor: IssueActivityActorClient | null;
};

function serializeActor(
  actor: IssueActivityLogRow["actor"],
): IssueActivityActorClient | null {
  if (!actor) return null;

  return {
    id: actor.id,
    name: actor.name,
    email: actor.email,
    avatarUrl: actor.avatarUrl,
    avatarPreset: isAvatarPreset(actor.avatarPreset) ? actor.avatarPreset : null,
  };
}

function parseMetadata(value: IssueActivityLogRow["metadata"]): IssueActivityMetadata {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as IssueActivityMetadata;
}

export function serializeIssueActivityLogs(
  rows: IssueActivityLogRow[],
): IssueActivityLogClient[] {
  return rows.map((row) => ({
    id: row.id,
    actorType: row.actorType,
    action: row.action,
    metadata: parseMetadata(row.metadata),
    occurredAt: row.occurredAt.toISOString(),
    actor: serializeActor(row.actor),
  }));
}
