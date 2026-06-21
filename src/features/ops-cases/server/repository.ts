import "server-only";

import type { OpsCase, OpsCaseSeverity, OpsCaseStatus, Prisma } from "@prisma/client";

import { prisma } from "@/db/client";
import { OPS_CASE_ACTIVE_STATUSES } from "@/features/ops-cases/lib/ops-case-active-statuses";

export type AdminOpsCaseListItem = Pick<
  OpsCase,
  | "number"
  | "title"
  | "type"
  | "source"
  | "severity"
  | "status"
  | "fingerprint"
  | "occurrenceCount"
  | "dueAt"
  | "createdAt"
  | "lastSeenAt"
> & {
  affectedUserEmail: string | null;
};

export type AdminOpsCaseDetail = OpsCase & {
  affectedUser: { id: string; name: string | null; email: string } | null;
  actorUser: { id: string; name: string | null; email: string } | null;
  workspace: { id: string; name: string; slug: string } | null;
  resolvedBy: { id: string; name: string | null; email: string } | null;
  previousIncidentsCount: number;
};

export type OpsCaseSummaryCounts = {
  openTotal: number;
  highOpen: number;
  criticalOpen: number;
  overdueOpen: number;
};

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
} as const;

export async function findActiveOpsCaseByDedupeKey(dedupeKey: string): Promise<OpsCase | null> {
  return prisma.opsCase.findFirst({
    where: {
      dedupeKey,
      status: { in: OPS_CASE_ACTIVE_STATUSES },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOpsCaseRecord(data: Prisma.OpsCaseCreateInput): Promise<OpsCase> {
  return prisma.opsCase.create({ data });
}

export async function bumpActiveOpsCaseOccurrence(id: string): Promise<OpsCase> {
  return prisma.opsCase.update({
    where: { id },
    data: {
      lastSeenAt: new Date(),
      occurrenceCount: { increment: 1 },
    },
  });
}

export async function countPreviousIncidents(input: {
  entityKind: string;
  entityId: string;
  excludeCaseId: string;
}): Promise<number> {
  return prisma.opsCase.count({
    where: {
      entityKind: input.entityKind,
      entityId: input.entityId,
      id: { not: input.excludeCaseId },
      status: { in: ["RESOLVED", "IGNORED", "ARCHIVED"] },
    },
  });
}

export async function getOpsCaseSummaryCounts(now: Date = new Date()): Promise<OpsCaseSummaryCounts> {
  const [openTotal, highOpen, criticalOpen, overdueOpen] = await Promise.all([
    prisma.opsCase.count({
      where: { status: { in: OPS_CASE_ACTIVE_STATUSES } },
    }),
    prisma.opsCase.count({
      where: { status: { in: OPS_CASE_ACTIVE_STATUSES }, severity: "HIGH" },
    }),
    prisma.opsCase.count({
      where: { status: { in: OPS_CASE_ACTIVE_STATUSES }, severity: "CRITICAL" },
    }),
    prisma.opsCase.count({
      where: {
        status: { in: OPS_CASE_ACTIVE_STATUSES },
        dueAt: { lt: now },
      },
    }),
  ]);

  return { openTotal, highOpen, criticalOpen, overdueOpen };
}

export async function listOpsCasesForAdmin(): Promise<AdminOpsCaseListItem[]> {
  const rows = await prisma.opsCase.findMany({
    select: {
      number: true,
      title: true,
      type: true,
      source: true,
      severity: true,
      status: true,
      fingerprint: true,
      occurrenceCount: true,
      dueAt: true,
      createdAt: true,
      lastSeenAt: true,
      affectedUser: {
        select: { email: true },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return rows.map((row) => ({
    number: row.number,
    title: row.title,
    type: row.type,
    source: row.source,
    severity: row.severity,
    status: row.status,
    fingerprint: row.fingerprint,
    occurrenceCount: row.occurrenceCount,
    dueAt: row.dueAt,
    createdAt: row.createdAt,
    lastSeenAt: row.lastSeenAt,
    affectedUserEmail: row.affectedUser?.email ?? null,
  }));
}

export async function getOpsCaseByNumber(number: number): Promise<AdminOpsCaseDetail | null> {
  const row = await prisma.opsCase.findUnique({
    where: { number },
    include: {
      affectedUser: { select: userSummarySelect },
      actorUser: { select: userSummarySelect },
      workspace: { select: { id: true, name: true, slug: true } },
      resolvedBy: { select: userSummarySelect },
    },
  });

  if (!row) {
    return null;
  }

  const previousIncidentsCount =
    row.entityKind && row.entityId
      ? await countPreviousIncidents({
          entityKind: row.entityKind,
          entityId: row.entityId,
          excludeCaseId: row.id,
        })
      : 0;

  return {
    ...row,
    previousIncidentsCount,
  };
}

export async function updateOpsCaseStatus(input: {
  number: number;
  status: Extract<OpsCaseStatus, "RESOLVED" | "IGNORED">;
  resolutionNotes: string;
  resolvedById: string;
}): Promise<OpsCase | null> {
  try {
    return await prisma.opsCase.update({
      where: { number: input.number },
      data: {
        status: input.status,
        resolutionNotes: input.resolutionNotes,
        resolvedAt: new Date(),
        resolvedById: input.resolvedById,
      },
    });
  } catch {
    return null;
  }
}

export async function listFailedReferralsWithoutActiveOpsCase(): Promise<
  Array<{
    id: string;
    referrerUserId: string;
    referredWorkspaceId: string;
    referredOwnerId: string;
    rewardFailureReason: string | null;
    rewardCents: number;
  }>
> {
  const failedReferrals = await prisma.referral.findMany({
    where: {
      status: "ACTIVE",
      rewardStatus: "FAILED",
    },
    select: {
      id: true,
      referrerUserId: true,
      referredWorkspaceId: true,
      referredOwnerId: true,
      rewardFailureReason: true,
      rewardCents: true,
    },
  });

  if (failedReferrals.length === 0) {
    return [];
  }

  const dedupeKeys = failedReferrals.map((referral) => `referral_reward_failed:${referral.id}`);
  const activeCases = await prisma.opsCase.findMany({
    where: {
      dedupeKey: { in: dedupeKeys },
      status: { in: OPS_CASE_ACTIVE_STATUSES },
    },
    select: { dedupeKey: true },
  });

  const activeDedupeKeys = new Set(activeCases.map((item) => item.dedupeKey));
  return failedReferrals.filter(
    (referral) => !activeDedupeKeys.has(`referral_reward_failed:${referral.id}`),
  );
}

export type { OpsCaseSeverity };
