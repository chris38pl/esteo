import type { Prisma, UsageMeter } from "@prisma/client";

import { prisma } from "@/db/client";

/** Sentinel userId for the workspace-total aggregate row (avoids NULLs in the unique key). */
export const WORKSPACE_TOTAL_USER = "";

/** UTC `YYYY-MM` period key used for monthly quotas. */
export function currentPeriodKey(now: Date = new Date()): string {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
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
  const quantity = params.quantity ?? 1;
  const periodKey = currentPeriodKey(params.now);

  await prisma.$transaction(async (tx) => {
    await tx.usageEvent.create({
      data: {
        workspaceId: params.workspaceId,
        userId: params.userId ?? null,
        meter: params.meter,
        quantity,
        occurredAt: params.now ?? new Date(),
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
