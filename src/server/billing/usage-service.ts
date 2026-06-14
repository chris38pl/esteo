import type { Prisma, UsageMeter } from "@prisma/client";

import { prisma } from "@/db/client";

/** Sentinel userId for the workspace-total aggregate row (avoids NULLs in the unique key). */
export const WORKSPACE_TOTAL_USER = "";

/** UTC `YYYY-MM` period key used for monthly quotas. */
export function currentPeriodKey(now: Date = new Date()): string {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
}

/** Inclusive UTC start and exclusive end for a {@link currentPeriodKey} value. */
export function periodBoundsFromKey(periodKey: string): { start: Date; end: Date } {
  const match = /^(\d{4})-(\d{2})$/.exec(periodKey);
  if (!match) {
    throw new Error(`Invalid period key: ${periodKey}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

export async function countEstimatesCreatedInPeriod(
  workspaceId: string,
  periodKey: string,
): Promise<number> {
  const { start, end } = periodBoundsFromKey(periodKey);
  return prisma.estimate.count({
    where: {
      workspaceId,
      createdAt: { gte: start, lt: end },
    },
  });
}

/**
 * Heals drift when estimate rows exist but metering was not recorded (e.g. submissions before
 * metering shipped). Only increases the workspace-total aggregate — never decreases.
 */
export async function reconcileEstimateUsageAggregate(
  workspaceId: string,
  periodKey: string = currentPeriodKey(),
): Promise<{ adjusted: number }> {
  const [recorded, estimateCount] = await Promise.all([
    getWorkspaceMeterUsage(workspaceId, "ESTIMATE_CREATED", periodKey),
    countEstimatesCreatedInPeriod(workspaceId, periodKey),
  ]);

  if (estimateCount <= recorded) {
    return { adjusted: 0 };
  }

  const delta = estimateCount - recorded;
  await recordUsage({
    workspaceId,
    userId: null,
    meter: "ESTIMATE_CREATED",
    quantity: delta,
  });

  return { adjusted: delta };
}

type Tx = Prisma.TransactionClient;

async function upsertAggregate(
  client: Tx,
  params: { workspaceId: string; userId: string; meter: UsageMeter; periodKey: string; quantity: number },
) {
  await client.usagePeriodAggregate.upsert({
    where: {
      workspaceId_userId_meter_periodKey: {
        workspaceId: params.workspaceId,
        userId: params.userId,
        meter: params.meter,
        periodKey: params.periodKey,
      },
    },
    create: {
      workspaceId: params.workspaceId,
      userId: params.userId,
      meter: params.meter,
      periodKey: params.periodKey,
      quantity: params.quantity,
    },
    update: { quantity: { increment: params.quantity } },
  });
}

/**
 * Records metered usage inside an existing transaction (e.g. co-located with estimate create).
 */
export async function recordUsageInTx(
  tx: Tx,
  params: {
    workspaceId: string;
    userId?: string | null;
    meter: UsageMeter;
    quantity?: number;
    now?: Date;
  },
): Promise<void> {
  const quantity = params.quantity ?? 1;
  const periodKey = currentPeriodKey(params.now);
  const occurredAt = params.now ?? new Date();

  await tx.usageEvent.create({
    data: {
      workspaceId: params.workspaceId,
      userId: params.userId ?? null,
      meter: params.meter,
      quantity,
      occurredAt,
    },
  });

  await upsertAggregate(tx, {
    workspaceId: params.workspaceId,
    userId: WORKSPACE_TOTAL_USER,
    meter: params.meter,
    periodKey,
    quantity,
  });

  if (params.userId) {
    await upsertAggregate(tx, {
      workspaceId: params.workspaceId,
      userId: params.userId,
      meter: params.meter,
      periodKey,
      quantity,
    });
  }
}

/**
 * Records metered usage: appends an immutable {@link UsageEvent} and increments both the
 * workspace-total aggregate and (when a user is known) the per-user attribution aggregate,
 * all in a single transaction. Adding a new metered feature is a new `meter` value, no schema change.
 */
export async function recordUsage(params: {
  workspaceId: string;
  userId?: string | null;
  meter: UsageMeter;
  quantity?: number;
  now?: Date;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await recordUsageInTx(tx, params);
  });
}

/** Current workspace-total usage for a meter in the active (or given) period. */
export async function getWorkspaceMeterUsage(
  workspaceId: string,
  meter: UsageMeter,
  periodKey: string = currentPeriodKey(),
): Promise<number> {
  const row = await prisma.usagePeriodAggregate.findUnique({
    where: {
      workspaceId_userId_meter_periodKey: {
        workspaceId,
        userId: WORKSPACE_TOTAL_USER,
        meter,
        periodKey,
      },
    },
    select: { quantity: true },
  });

  return row?.quantity ?? 0;
}

/** Per-member breakdown for a meter (for the workspace usage/billing report). */
export async function getPerUserMeterUsage(
  workspaceId: string,
  meter: UsageMeter,
  periodKey: string = currentPeriodKey(),
): Promise<Array<{ userId: string; quantity: number }>> {
  const rows = await prisma.usagePeriodAggregate.findMany({
    where: {
      workspaceId,
      meter,
      periodKey,
      userId: { not: WORKSPACE_TOTAL_USER },
    },
    select: { userId: true, quantity: true },
    orderBy: { quantity: "desc" },
  });

  return rows.map((row) => ({ userId: row.userId, quantity: row.quantity }));
}
