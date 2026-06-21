import "server-only";

import type { SubscriptionStatus } from "@prisma/client";

import {
  notifySubscriptionExpired,
  notifySubscriptionGracePeriod,
  notifySubscriptionPastDue,
  resolveWorkspaceBillingNotifications,
} from "@/features/notifications/server/notification-emit-helpers";
import {
  fireNotification,
  loadWorkspaceNotificationContext,
} from "@/features/notifications/server/notification-workspace-context";

export async function syncBillingStatusNotifications(input: {
  workspaceId: string;
  previousStatus: SubscriptionStatus | null;
  nextStatus: SubscriptionStatus;
}): Promise<void> {
  if (input.previousStatus === input.nextStatus) {
    return;
  }

  if (input.nextStatus === "ACTIVE" || input.nextStatus === "TRIAL") {
    await resolveWorkspaceBillingNotifications(input.workspaceId);
    return;
  }

  const ctx = await loadWorkspaceNotificationContext(input.workspaceId);
  if (!ctx) {
    return;
  }

  if (input.nextStatus === "PAST_DUE") {
    fireNotification(notifySubscriptionPastDue(ctx));
    return;
  }

  if (input.nextStatus === "GRACE_PERIOD") {
    fireNotification(notifySubscriptionGracePeriod(ctx));
    return;
  }

  if (input.nextStatus === "EXPIRED") {
    fireNotification(notifySubscriptionExpired(ctx));
  }
}
