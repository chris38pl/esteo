import "server-only";

import { Prisma } from "@prisma/client";
import type { NotificationType } from "@prisma/client";

import { prisma } from "@/db/client";
import { getNotificationListSinceDate } from "@/features/notifications/lib/notification-constants";
import type { NotificationCounts, NotificationListItem } from "@/features/notifications/lib/notification-types";

const listSelect = {
  id: true,
  type: true,
  state: true,
  priority: true,
  href: true,
  primaryActionLabelKey: true,
  primaryActionHref: true,
  secondaryActionLabelKey: true,
  secondaryActionHref: true,
  payload: true,
  readAt: true,
  resolvedAt: true,
  createdAt: true,
  workspaceId: true,
  workspace: {
    select: { name: true },
  },
} satisfies Prisma.UserNotificationSelect;

function listWhereBase(userId: string, since: Date): Prisma.UserNotificationWhereInput {
  return {
    userId,
    createdAt: { gte: since },
  };
}

export async function createNotificationRecord(input: {
  userId: string;
  workspaceId: string | null;
  type: NotificationType;
  state: "INFO" | "ACTION_REQUIRED";
  priority: "LOW" | "NORMAL" | "HIGH";
  dedupeKey: string;
  href: string;
  primaryActionLabelKey: string | null;
  primaryActionHref: string | null;
  secondaryActionLabelKey: string | null;
  secondaryActionHref: string | null;
  payload: Record<string, unknown>;
}): Promise<{ created: boolean; id: string | null }> {
  try {
    const row = await prisma.userNotification.create({
      data: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        type: input.type,
        state: input.state,
        priority: input.priority,
        dedupeKey: input.dedupeKey,
        href: input.href,
        primaryActionLabelKey: input.primaryActionLabelKey,
        primaryActionHref: input.primaryActionHref,
        secondaryActionLabelKey: input.secondaryActionLabelKey,
        secondaryActionHref: input.secondaryActionHref,
        payload: input.payload as Prisma.InputJsonValue,
      },
    });
    return { created: true, id: row.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.userNotification.findUnique({
        where: {
          userId_dedupeKey: {
            userId: input.userId,
            dedupeKey: input.dedupeKey,
          },
        },
        select: { id: true },
      });
      return { created: false, id: existing?.id ?? null };
    }
    throw error;
  }
}

export async function countNotificationsForUser(userId: string): Promise<NotificationCounts> {
  const since = getNotificationListSinceDate();
  const base = listWhereBase(userId, since);

  const [total, unread, actionRequired] = await Promise.all([
    prisma.userNotification.count({ where: base }),
    prisma.userNotification.count({
      where: {
        ...base,
        readAt: null,
      },
    }),
    prisma.userNotification.count({
      where: {
        ...base,
        state: "ACTION_REQUIRED",
        resolvedAt: null,
      },
    }),
  ]);

  return { total, unread, actionRequired };
}

export async function listNotificationsForUser(input: {
  userId: string;
  actionRequiredOnly?: boolean;
  limit?: number;
  cursor?: string;
}): Promise<{ items: NotificationListItem[]; nextCursor: string | null }> {
  const since = getNotificationListSinceDate();
  const limit = input.limit ?? 20;

  const where: Prisma.UserNotificationWhereInput = {
    ...listWhereBase(input.userId, since),
    ...(input.actionRequiredOnly
      ? { state: "ACTION_REQUIRED", resolvedAt: null }
      : {}),
    ...(input.cursor ? { id: { lt: input.cursor } } : {}),
  };

  const rows = await prisma.userNotification.findMany({
    where,
    select: listSelect,
    orderBy: [{ state: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => ({
      id: row.id,
      type: row.type,
      state: row.state,
      priority: row.priority,
      href: row.href,
      primaryActionLabelKey: row.primaryActionLabelKey,
      primaryActionHref: row.primaryActionHref,
      secondaryActionLabelKey: row.secondaryActionLabelKey,
      secondaryActionHref: row.secondaryActionHref,
      payload: row.payload,
      readAt: row.readAt,
      resolvedAt: row.resolvedAt,
      createdAt: row.createdAt,
      workspaceId: row.workspaceId,
      workspaceName: row.workspace?.name ?? null,
    })),
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  };
}

export async function markNotificationReadForUser(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  const result = await prisma.userNotification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count > 0;
}

export async function resolveNotificationsByDedupeKeys(input: {
  userIds?: string[];
  dedupeKeys?: string[];
  dedupeKeyPrefix?: string;
  types?: NotificationType[];
}): Promise<number> {
  const now = new Date();
  const where: Prisma.UserNotificationWhereInput = {
    resolvedAt: null,
    ...(input.userIds ? { userId: { in: input.userIds } } : {}),
    ...(input.dedupeKeys ? { dedupeKey: { in: input.dedupeKeys } } : {}),
    ...(input.dedupeKeyPrefix
      ? { dedupeKey: { startsWith: input.dedupeKeyPrefix } }
      : {}),
    ...(input.types ? { type: { in: input.types } } : {}),
  };

  const result = await prisma.userNotification.updateMany({
    where,
    data: { resolvedAt: now, readAt: now, state: "INFO" },
  });

  return result.count;
}

export async function archiveOldNotifications(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 90);

  const result = await prisma.userNotification.updateMany({
    where: {
      archivedAt: null,
      createdAt: { lt: cutoff },
      OR: [{ resolvedAt: { not: null } }, { readAt: { not: null } }],
      NOT: {
        state: "ACTION_REQUIRED",
        resolvedAt: null,
      },
    },
    data: { archivedAt: now },
  });

  return result.count;
}
