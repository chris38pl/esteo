import "server-only";

import { prisma } from "@/db/client";
import { emitUserNotification } from "@/features/notifications/server/emit-notification";
import {
  resolveBillingNotificationsForWorkspace,
  resolveInvitationNotification,
  resolveRequestNotifications,
} from "@/features/notifications/server/resolve-notification";
import { loadWorkspaceNotificationContext } from "@/features/notifications/server/notification-workspace-context";

export async function notifyEstimateRequestOutcome(input: {
  requestId: string;
  workspaceId: string;
  outcome: "completed" | "failed";
}): Promise<void> {
  const ctx = await loadWorkspaceNotificationContext(input.workspaceId);
  if (!ctx) {
    return;
  }

  const request = await prisma.estimateRequest.findUnique({
    where: { id: input.requestId },
    select: {
      projectDescription: true,
      estimate: { select: { title: true } },
    },
  });

  const requestTitle =
    request?.estimate?.title ??
    request?.projectDescription.slice(0, 60) ??
    "Request";

  if (input.outcome === "completed") {
    await notifyEstimateRequestAiCompleted({
      ...ctx,
      requestId: input.requestId,
      requestTitle,
    });
    return;
  }

  await notifyEstimateRequestAiFailed({
    ...ctx,
    requestId: input.requestId,
    requestTitle,
  });
}

type WorkspaceContext = {
  locale: string;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
};

export async function notifyInvitationReceived(input: {
  locale: string;
  invitationId: string;
  invitationToken: string;
  inviteeEmail: string;
  workspaceName: string;
}) {
  return emitUserNotification({
    type: "invitation_received",
    context: {
      locale: input.locale,
      inviteeEmail: input.inviteeEmail,
      payload: {
        invitationId: input.invitationId,
        invitationToken: input.invitationToken,
        workspaceName: input.workspaceName,
      },
    },
  });
}

export async function notifyInvitationAccepted(input: WorkspaceContext & {
  invitationId: string;
}) {
  await resolveInvitationNotification(input.invitationId);
  return emitUserNotification({
    type: "invitation_accepted",
    context: {
      locale: input.locale,
      workspaceId: input.workspaceId,
      workspaceSlug: input.workspaceSlug,
      payload: {
        invitationId: input.invitationId,
        workspaceName: input.workspaceName,
      },
    },
  });
}

export async function notifyInvitationDeclined(input: WorkspaceContext & {
  invitationId: string;
}) {
  await resolveInvitationNotification(input.invitationId);
  return emitUserNotification({
    type: "invitation_declined",
    context: {
      locale: input.locale,
      workspaceId: input.workspaceId,
      workspaceSlug: input.workspaceSlug,
      payload: {
        invitationId: input.invitationId,
        workspaceName: input.workspaceName,
      },
    },
  });
}

export async function notifyInvitationRevoked(input: {
  locale: string;
  invitationId: string;
  inviteeEmail: string;
  workspaceName: string;
}) {
  return emitUserNotification({
    type: "invitation_revoked",
    context: {
      locale: input.locale,
      inviteeEmail: input.inviteeEmail,
      payload: {
        invitationId: input.invitationId,
        workspaceName: input.workspaceName,
      },
    },
  });
}

export async function notifyOwnershipTransferReceived(input: {
  locale: string;
  transferId: string;
  transferToken: string;
  recipientUserId: string;
  workspaceName: string;
}) {
  return emitUserNotification({
    type: "ownership_transfer_received",
    context: {
      locale: input.locale,
      userIds: [input.recipientUserId],
      payload: {
        transferId: input.transferId,
        transferToken: input.transferToken,
        workspaceName: input.workspaceName,
      },
    },
  });
}

export async function notifyEstimateRequestSubmitted(input: WorkspaceContext & {
  requestId: string;
  requestTitle: string;
  queuedManual?: boolean;
}) {
  if (input.queuedManual) {
    return emitUserNotification({
      type: "estimate_request_queued_manual",
      context: {
        locale: input.locale,
        workspaceId: input.workspaceId,
        workspaceSlug: input.workspaceSlug,
        payload: {
          requestId: input.requestId,
          requestTitle: input.requestTitle,
        },
      },
    });
  }

  return emitUserNotification({
    type: "estimate_request_submitted",
    context: {
      locale: input.locale,
      workspaceId: input.workspaceId,
      workspaceSlug: input.workspaceSlug,
      payload: {
        requestId: input.requestId,
        requestTitle: input.requestTitle,
      },
    },
  });
}

export async function notifyEstimateRequestAiCompleted(input: WorkspaceContext & {
  requestId: string;
  requestTitle: string;
}) {
  await resolveRequestNotifications(input.requestId);
  return emitUserNotification({
    type: "estimate_request_ai_completed",
    context: {
      locale: input.locale,
      workspaceId: input.workspaceId,
      workspaceSlug: input.workspaceSlug,
      payload: {
        requestId: input.requestId,
        requestTitle: input.requestTitle,
      },
    },
  });
}

export async function notifyEstimateRequestAiFailed(input: WorkspaceContext & {
  requestId: string;
  requestTitle: string;
}) {
  return emitUserNotification({
    type: "estimate_request_ai_failed",
    context: {
      locale: input.locale,
      workspaceId: input.workspaceId,
      workspaceSlug: input.workspaceSlug,
      payload: {
        requestId: input.requestId,
        requestTitle: input.requestTitle,
      },
    },
  });
}

export async function notifySubscriptionExpired(input: WorkspaceContext) {
  return emitUserNotification({
    type: "subscription_expired",
    context: {
      locale: input.locale,
      workspaceId: input.workspaceId,
      workspaceSlug: input.workspaceSlug,
      payload: {
        workspaceId: input.workspaceId,
        workspaceName: input.workspaceName,
      },
    },
  });
}

export async function notifySubscriptionPastDue(input: WorkspaceContext) {
  return emitUserNotification({
    type: "subscription_past_due",
    context: {
      locale: input.locale,
      workspaceId: input.workspaceId,
      workspaceSlug: input.workspaceSlug,
      payload: {
        workspaceId: input.workspaceId,
        workspaceName: input.workspaceName,
      },
    },
  });
}

export async function notifySubscriptionGracePeriod(input: WorkspaceContext) {
  return emitUserNotification({
    type: "subscription_grace_period",
    context: {
      locale: input.locale,
      workspaceId: input.workspaceId,
      workspaceSlug: input.workspaceSlug,
      payload: {
        workspaceId: input.workspaceId,
        workspaceName: input.workspaceName,
      },
    },
  });
}

export async function resolveWorkspaceBillingNotifications(workspaceId: string) {
  return resolveBillingNotificationsForWorkspace(workspaceId);
}

export async function notifyReferralSignupPending(input: {
  locale: string;
  referrerUserId: string;
  referralId: string;
}) {
  return emitUserNotification({
    type: "referral_signup_pending",
    context: {
      locale: input.locale,
      referrerUserId: input.referrerUserId,
      payload: { referralId: input.referralId },
    },
  });
}

export async function notifyReferralRewardGranted(input: {
  locale: string;
  referrerUserId: string;
  referralId: string;
}) {
  return emitUserNotification({
    type: "referral_reward_granted",
    context: {
      locale: input.locale,
      referrerUserId: input.referrerUserId,
      payload: { referralId: input.referralId },
    },
  });
}

export async function notifyIssueStatusChanged(input: {
  locale: string;
  issueNumber: number;
  issueTitle: string;
  oldStatus: string;
  newStatus: string;
}) {
  return emitUserNotification({
    type: "issue_status_changed",
    context: {
      locale: input.locale,
      payload: {
        issueNumber: input.issueNumber,
        issueTitle: input.issueTitle,
        oldStatus: input.oldStatus,
        newStatus: input.newStatus,
      },
    },
  });
}

export async function notifySubscriptionRenewalSoon(input: WorkspaceContext & {
  daysRemaining: number;
  periodEndIso: string;
}) {
  return emitUserNotification({
    type: "subscription_renewal_soon",
    context: {
      locale: input.locale,
      workspaceId: input.workspaceId,
      workspaceSlug: input.workspaceSlug,
      payload: {
        workspaceId: input.workspaceId,
        workspaceName: input.workspaceName,
        daysRemaining: input.daysRemaining,
        periodEndIso: input.periodEndIso,
      },
    },
  });
}

export async function notifyReferralActivated(input: {
  locale: string;
  referrerUserId: string;
  referralId: string;
}) {
  return emitUserNotification({
    type: "referral_activated",
    context: {
      locale: input.locale,
      referrerUserId: input.referrerUserId,
      payload: { referralId: input.referralId },
    },
  });
}

export async function notifyReferralRewardFailed(input: {
  locale: string;
  referrerUserId: string;
  referralId: string;
}) {
  return emitUserNotification({
    type: "referral_reward_failed",
    context: {
      locale: input.locale,
      referrerUserId: input.referrerUserId,
      payload: { referralId: input.referralId },
    },
  });
}

export async function notifyEstimateLimitNear(
  ctx: WorkspaceContext & { used: number; limit: number },
) {
  return emitUserNotification({
    type: "estimate_limit_near",
    context: {
      locale: ctx.locale,
      workspaceId: ctx.workspaceId,
      workspaceSlug: ctx.workspaceSlug,
      payload: {
        workspaceId: ctx.workspaceId,
        workspaceName: ctx.workspaceName,
        used: ctx.used,
        limit: ctx.limit,
      },
    },
  });
}

export async function notifyEstimateLimitReached(
  ctx: WorkspaceContext & { used: number; limit: number },
) {
  return emitUserNotification({
    type: "estimate_limit_reached",
    context: {
      locale: ctx.locale,
      workspaceId: ctx.workspaceId,
      workspaceSlug: ctx.workspaceSlug,
      payload: {
        workspaceId: ctx.workspaceId,
        workspaceName: ctx.workspaceName,
        used: ctx.used,
        limit: ctx.limit,
      },
    },
  });
}
