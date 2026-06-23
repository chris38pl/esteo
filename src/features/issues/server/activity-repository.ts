import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";
import type {
  IssueActivityAction,
  IssueActivityActorType,
  IssueActivityMetadata,
} from "@/features/issues/lib/issue-activity-types";

const actorSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  avatarPreset: true,
} as const;

const issueActivityLogSelect = {
  id: true,
  issueId: true,
  actorType: true,
  actorUserId: true,
  action: true,
  metadata: true,
  occurredAt: true,
  actor: { select: actorSelect },
} satisfies Prisma.IssueActivityLogSelect;

export type IssueActivityLogRow = {
  id: string;
  issueId: string;
  actorType: IssueActivityActorType;
  actorUserId: string | null;
  action: string;
  metadata: Prisma.JsonValue | null;
  occurredAt: Date;
  actor: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    avatarPreset: string | null;
  } | null;
};

type IssueActivityClient = Prisma.TransactionClient | typeof prisma;

export async function createIssueActivityLog(
  input: {
    issueId: string;
    actorType: IssueActivityActorType;
    actorUserId?: string | null;
    action: IssueActivityAction;
    metadata?: IssueActivityMetadata;
  },
  tx: IssueActivityClient = prisma,
): Promise<IssueActivityLogRow | null> {
  const actorUserId = input.actorType === "USER" ? (input.actorUserId ?? null) : null;

  if (input.actorType === "USER" && !actorUserId) {
    console.error("[issue activity] USER actor requires actorUserId", input.action);
    return null;
  }

  return tx.issueActivityLog.create({
    data: {
      issueId: input.issueId,
      actorType: input.actorType,
      actorUserId,
      action: input.action,
      metadata: input.metadata,
    },
    select: issueActivityLogSelect,
  });
}

export { issueActivityLogSelect };
