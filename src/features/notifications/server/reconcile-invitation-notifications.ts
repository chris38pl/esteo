import "server-only";

import { cache } from "react";

import { prisma } from "@/db/client";
import { parseNotificationInvitationPayload } from "@/features/notifications/lib/notification-invitation-payload";
import { resolveInvitationNotification } from "@/features/notifications/server/resolve-notification";
import { isPendingInvitationForRecipient } from "@/features/workspaces/lib/invitation-token-access";

async function reconcileStaleInvitationNotificationsUncached(
  userId: string,
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    return 0;
  }

  let resolved = 0;

  const legacyFixed = await prisma.userNotification.updateMany({
    where: {
      userId,
      type: { in: ["invitation_received", "invitation_on_hold"] },
      resolvedAt: { not: null },
      state: "ACTION_REQUIRED",
    },
    data: { state: "INFO" },
  });
  resolved += legacyFixed.count;

  const openNotifications = await prisma.userNotification.findMany({
    where: {
      userId,
      type: { in: ["invitation_received", "invitation_on_hold"] },
      resolvedAt: null,
    },
    select: { payload: true },
  });

  if (openNotifications.length === 0) {
    return resolved;
  }

  for (const notification of openNotifications) {
    const payload = parseNotificationInvitationPayload(notification.payload);
    if (!payload) {
      continue;
    }

    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        id: payload.invitationId,
        email: user.email.toLowerCase(),
      },
      select: {
        email: true,
        status: true,
        expiresAt: true,
        workspace: { select: { deletedAt: true } },
      },
    });

    if (!isPendingInvitationForRecipient(invitation, user.email)) {
      resolved += await resolveInvitationNotification(payload.invitationId);
    }
  }

  return resolved;
}

export const reconcileStaleInvitationNotifications = cache(
  reconcileStaleInvitationNotificationsUncached,
);
