import "server-only";

import { cache } from "react";

import {
  countNotificationsForUser,
  listNotificationsForUser,
  markNotificationReadForUser,
} from "@/features/notifications/server/notification-repository";

export const getNotificationCounts = cache(async (userId: string) => {
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
