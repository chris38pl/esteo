import "server-only";

import { cache } from "react";

import {
  countNotificationsForUser,
  listNotificationsForUser,
  markNotificationReadForUser,
} from "@/features/notifications/server/notification-repository";
import { reconcileStaleInvitationNotifications } from "@/features/notifications/server/reconcile-invitation-notifications";

export const getNotificationCounts = cache(async (userId: string) => {
  await reconcileStaleInvitationNotifications(userId);
  return countNotificationsForUser(userId);
});

export async function getNotificationsList(input: {
  userId: string;
  actionRequiredOnly?: boolean;
  cursor?: string;
  limit?: number;
}) {
  return listNotificationsForUser(input);
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  return markNotificationReadForUser(userId, notificationId);
}
