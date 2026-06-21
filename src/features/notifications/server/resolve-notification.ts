import "server-only";

import type { NotificationType } from "@prisma/client";

import { resolveNotificationsByDedupeKeys } from "@/features/notifications/server/notification-repository";

export async function resolveBillingNotificationsForWorkspace(workspaceId: string): Promise<number> {
  return resolveNotificationsByDedupeKeys({
    dedupeKeys: [
      `billing:past_due:${workspaceId}`,
      `billing:grace:${workspaceId}`,
      `billing:expired:${workspaceId}`,
      `billing:provisioning:${workspaceId}`,
      `limits:estimate_reached:${workspaceId}`,
    ],
  });
}

export async function resolveRequestNotifications(requestId: string): Promise<number> {
  return resolveNotificationsByDedupeKeys({
    dedupeKeys: [
      `request:${requestId}:queued`,
      `trigger:ai_failed:${requestId}`,
    ],
    types: ["estimate_request_queued_manual", "estimate_request_ai_failed"],
  });
}

export async function resolveInvitationNotification(invitationId: string): Promise<number> {
  return resolveNotificationsByDedupeKeys({
    dedupeKeys: [`invite:${invitationId}`],
    types: ["invitation_received", "invitation_on_hold"],
  });
}

export async function resolveReferralRewardFailed(referralId: string): Promise<number> {
  return resolveNotificationsByDedupeKeys({
    dedupeKeys: [`referral:reward_failed:${referralId}`],
    types: ["referral_reward_failed"],
  });
}

export async function resolveNotificationsByTypeAndPrefix(input: {
  type: NotificationType;
  dedupeKeyPrefix: string;
  userIds?: string[];
}): Promise<number> {
  return resolveNotificationsByDedupeKeys({
    types: [input.type],
    dedupeKeyPrefix: input.dedupeKeyPrefix,
    userIds: input.userIds,
  });
}
