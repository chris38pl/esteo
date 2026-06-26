"use server";

import { revalidatePath } from "next/cache";

import type { NotificationPreferenceCategory } from "@prisma/client";

import { NOTIFICATION_PANEL_PAGE_SIZE } from "@/features/notifications/lib/notification-constants";
import type { NotificationCounts } from "@/features/notifications/lib/notification-types";
import {
  getNotificationCounts,
  getNotificationsList,
  markNotificationAsRead,
} from "@/features/notifications/server/get-notifications";
import { countNotificationsForUser } from "@/features/notifications/server/notification-repository";
import { reconcileStaleInvitationNotifications } from "@/features/notifications/server/reconcile-invitation-notifications";
import {
  getNotificationPreferencesForUser,
  setNotificationPreference,
} from "@/features/notifications/server/notification-preferences";
import { requireAuth } from "@/server/auth/require-auth";
import type { Locale } from "@/lib/locale";

export async function fetchNotificationPanelAction(input: {
  locale: Locale;
  actionRequiredOnly?: boolean;
  cursor?: string;
}) {
  const user = await requireAuth(input.locale);

  await reconcileStaleInvitationNotifications(user.id);

  const [counts, list] = await Promise.all([
    getNotificationCounts(user.id),
    getNotificationsList({
      userId: user.id,
      actionRequiredOnly: input.actionRequiredOnly,
      cursor: input.cursor,
      limit: NOTIFICATION_PANEL_PAGE_SIZE,
    }),
  ]);

  return {
    counts,
    items: list.items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      readAt: item.readAt?.toISOString() ?? null,
      resolvedAt: item.resolvedAt?.toISOString() ?? null,
    })),
    nextCursor: list.nextCursor,
  };
}

export async function markNotificationReadAction(input: {
  locale: Locale;
  notificationId: string;
}): Promise<{ ok: boolean; counts: NotificationCounts | null }> {
  const user = await requireAuth(input.locale);
  const updated = await markNotificationAsRead(user.id, input.notificationId);

  if (!updated) {
    return { ok: false, counts: null };
  }

  revalidatePath("/", "layout");
  const counts = await countNotificationsForUser(user.id);
  return { ok: true, counts };
}

export async function fetchNotificationPreferencesAction(locale: Locale) {
  const user = await requireAuth(locale);
  return getNotificationPreferencesForUser(user.id);
}

export async function updateNotificationPreferenceAction(input: {
  locale: Locale;
  category: NotificationPreferenceCategory;
  enabled: boolean;
}) {
  const user = await requireAuth(input.locale);
  await setNotificationPreference({
    userId: user.id,
    category: input.category,
    enabled: input.enabled,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
