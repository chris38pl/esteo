import "server-only";

import type { NotificationPreferenceCategory } from "@prisma/client";

import { prisma } from "@/db/client";
import { NOTIFICATION_PREFERENCE_CATEGORIES } from "@/features/notifications/lib/notification-preference-categories";

export async function isNotificationCategoryEnabled(
  userId: string,
  category: NotificationPreferenceCategory,
): Promise<boolean> {
  const pref = await prisma.userNotificationPreference.findUnique({
    where: {
      userId_category: { userId, category },
    },
    select: { enabled: true },
  });

  return pref?.enabled ?? true;
}

export async function getNotificationPreferencesForUser(
  userId: string,
): Promise<Record<NotificationPreferenceCategory, boolean>> {
  const rows = await prisma.userNotificationPreference.findMany({
    where: { userId },
    select: { category: true, enabled: true },
  });

  const map = Object.fromEntries(
    NOTIFICATION_PREFERENCE_CATEGORIES.map((category) => [category, true]),
  ) as Record<NotificationPreferenceCategory, boolean>;

  for (const row of rows) {
    map[row.category] = row.enabled;
  }

  return map;
}

export async function setNotificationPreference(input: {
  userId: string;
  category: NotificationPreferenceCategory;
  enabled: boolean;
}): Promise<void> {
  await prisma.userNotificationPreference.upsert({
    where: {
      userId_category: {
        userId: input.userId,
        category: input.category,
      },
    },
    create: {
      userId: input.userId,
      category: input.category,
      enabled: input.enabled,
    },
    update: {
      enabled: input.enabled,
    },
  });
}
