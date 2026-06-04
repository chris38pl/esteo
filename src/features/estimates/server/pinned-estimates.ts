import "server-only";

import { prisma } from "@/db/client";
import type { PinnedEstimateSidebarItem } from "@/components/layout/app-sidebar/pinned-config";
import { requireWorkspace } from "@/server/permissions/require-workspace";
import type { User } from "@prisma/client";

function pinnedEstimateTitle(title: string | null, estimateId: string): string {
  return title?.trim() || `Estimate ${estimateId.slice(-6)}`;
}

function pinnedEstimateUpdatedAt(estimate: {
  updatedAt: Date;
  latestVersion: { updatedAt: Date } | null;
}): string {
  const latest = estimate.latestVersion?.updatedAt ?? estimate.updatedAt;
  return latest.toISOString();
}

export async function listPinnedEstimatesForSidebar(input: {
  userId: string;
  workspaceId: string;
  workspaceSlug: string;
}): Promise<PinnedEstimateSidebarItem[]> {
  const rows = await prisma.pinnedEstimate.findMany({
    where: {
      userId: input.userId,
      workspaceId: input.workspaceId,
      estimate: { deletedAt: null },
    },
    orderBy: { sortOrder: "asc" },
    include: {
      estimate: {
        select: {
          id: true,
          title: true,
          updatedAt: true,
          latestVersion: { select: { updatedAt: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    estimateId: row.estimate.id,
    title: pinnedEstimateTitle(row.estimate.title, row.estimate.id),
    updatedAt: pinnedEstimateUpdatedAt(row.estimate),
    workspaceSlug: input.workspaceSlug,
  }));
}

export async function isEstimatePinned(input: {
  userId: string;
  workspaceId: string;
  estimateId: string;
}): Promise<boolean> {
  const row = await prisma.pinnedEstimate.findUnique({
    where: {
      userId_workspaceId_estimateId: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        estimateId: input.estimateId,
      },
    },
    select: { id: true },
  });
  return row != null;
}

export async function pinEstimate(
  user: User,
  input: { workspaceId: string; estimateId: string },
): Promise<void> {
  await requireWorkspace(user, input.workspaceId);

  const estimate = await prisma.estimate.findFirst({
    where: {
      id: input.estimateId,
      workspaceId: input.workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!estimate) {
    throw new Error("Estimate not found.");
  }

  const existing = await prisma.pinnedEstimate.findUnique({
    where: {
      userId_workspaceId_estimateId: {
        userId: user.id,
        workspaceId: input.workspaceId,
        estimateId: input.estimateId,
      },
    },
  });

  if (existing) {
    return;
  }

  const maxOrder = await prisma.pinnedEstimate.aggregate({
    where: { userId: user.id, workspaceId: input.workspaceId },
    _max: { sortOrder: true },
  });

  await prisma.pinnedEstimate.create({
    data: {
      userId: user.id,
      workspaceId: input.workspaceId,
      estimateId: input.estimateId,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
}

export async function unpinEstimate(
  user: User,
  input: { workspaceId: string; estimateId: string },
): Promise<void> {
  await requireWorkspace(user, input.workspaceId);

  await prisma.pinnedEstimate.deleteMany({
    where: {
      userId: user.id,
      workspaceId: input.workspaceId,
      estimateId: input.estimateId,
    },
  });
}

export async function reorderPinnedEstimates(
  user: User,
  input: { workspaceId: string; estimateIds: string[] },
): Promise<void> {
  await requireWorkspace(user, input.workspaceId);

  const uniqueIds = [...new Set(input.estimateIds)];
  if (uniqueIds.length === 0) {
    return;
  }

  const owned = await prisma.pinnedEstimate.findMany({
    where: {
      userId: user.id,
      workspaceId: input.workspaceId,
      estimateId: { in: uniqueIds },
    },
    select: { estimateId: true },
  });

  if (owned.length !== uniqueIds.length) {
    throw new Error("Invalid pinned estimate order.");
  }

  await prisma.$transaction(
    uniqueIds.map((estimateId, index) =>
      prisma.pinnedEstimate.update({
        where: {
          userId_workspaceId_estimateId: {
            userId: user.id,
            workspaceId: input.workspaceId,
            estimateId,
          },
        },
        data: { sortOrder: index },
      }),
    ),
  );
}
