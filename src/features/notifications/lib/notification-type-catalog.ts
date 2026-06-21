import { z } from "zod";

import type { NotificationPreferenceCategory } from "@prisma/client";

import type {
  EmitContext,
  NotificationActionDef,
  NotificationScope,
  RecipientToken,
} from "@/features/notifications/lib/notification-types";
import { dashboardEstimatesHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";

const issueStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "ARCHIVED"]);

const requestPayloadSchema = z.object({
  requestId: z.string(),
  requestTitle: z.string(),
});

const invitationPayloadSchema = z.object({
  invitationId: z.string(),
  workspaceName: z.string(),
});

const transferPayloadSchema = z.object({
  transferId: z.string(),
  workspaceName: z.string(),
});

const billingWorkspacePayloadSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
});

const subscriptionRenewalPayloadSchema = billingWorkspacePayloadSchema.extend({
  daysRemaining: z.number().int(),
  periodEndIso: z.string(),
});

const referralPayloadSchema = z.object({
  referralId: z.string().optional(),
});

const issueStatusPayloadSchema = z.object({
  issueNumber: z.number().int(),
  issueTitle: z.string(),
  oldStatus: issueStatusSchema,
  newStatus: issueStatusSchema,
});

const estimateLimitPayloadSchema = billingWorkspacePayloadSchema.extend({
  used: z.number().int(),
  limit: z.number().int(),
});

export type NotificationTypeDefinition = {
  state: "INFO" | "ACTION_REQUIRED";
  priority: "LOW" | "NORMAL" | "HIGH";
  scope: NotificationScope;
  category: NotificationPreferenceCategory;
  defaultRecipients: RecipientToken;
  metadataSchema: z.ZodType<Record<string, unknown>>;
  dedupeKey: (ctx: EmitContext) => string;
  href: (ctx: EmitContext) => string;
  primaryAction?: (ctx: EmitContext) => NotificationActionDef;
  secondaryAction?: (ctx: EmitContext) => NotificationActionDef;
  resolveWhen?: string;
};

function workspaceBillingHref(ctx: EmitContext, path = "billing"): string {
  return `/${ctx.locale}/dashboard/${ctx.workspaceSlug}/${path}`;
}

function invitationHref(ctx: EmitContext): string {
  const token = String(ctx.payload.invitationToken ?? ctx.payload.invitationId ?? "");
  return `/${ctx.locale}/dashboard/invitations/${token}`;
}

function transferHref(ctx: EmitContext): string {
  const token = String(ctx.payload.transferToken ?? "");
  return `/${ctx.locale}/dashboard/transfer/${token}`;
}

function requestHref(ctx: EmitContext): string {
  const requestId = String(ctx.payload.requestId ?? "");
  return `/${ctx.locale}/dashboard/${ctx.workspaceSlug}/requests/${requestId}`;
}

export const NOTIFICATION_TYPE_CATALOG = {
  invitation_received: {
    state: "ACTION_REQUIRED",
    priority: "HIGH",
    scope: "user",
    category: "MEMBERSHIP",
    defaultRecipients: "invitee_by_email",
    metadataSchema: invitationPayloadSchema.extend({
      invitationToken: z.string(),
    }),
    dedupeKey: (ctx) => `invite:${ctx.payload.invitationId}`,
    href: invitationHref,
    primaryAction: (ctx) => ({
      labelKey: "notifications.actions.acceptInvite",
      href: `${invitationHref(ctx)}?action=accept`,
    }),
    secondaryAction: (ctx) => ({
      labelKey: "notifications.actions.declineInvite",
      href: `${invitationHref(ctx)}?action=decline`,
    }),
    resolveWhen: "invitation_closed",
  },
  invitation_accepted: {
    state: "INFO",
    priority: "NORMAL",
    scope: "workspace",
    category: "MEMBERSHIP",
    defaultRecipients: "workspace_owner",
    metadataSchema: invitationPayloadSchema,
    dedupeKey: (ctx) => `invite:accepted:${ctx.payload.invitationId}`,
    href: (ctx) => `/${ctx.locale}/dashboard/${ctx.workspaceSlug}/settings/team`,
  },
  invitation_declined: {
    state: "INFO",
    priority: "NORMAL",
    scope: "workspace",
    category: "MEMBERSHIP",
    defaultRecipients: "workspace_owner",
    metadataSchema: invitationPayloadSchema,
    dedupeKey: (ctx) => `invite:declined:${ctx.payload.invitationId}`,
    href: (ctx) => `/${ctx.locale}/dashboard/${ctx.workspaceSlug}/settings/team`,
  },
  invitation_revoked: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "MEMBERSHIP",
    defaultRecipients: "invitee_by_email",
    metadataSchema: invitationPayloadSchema,
    dedupeKey: (ctx) => `invite:revoked:${ctx.payload.invitationId}`,
    href: (ctx) => `/${ctx.locale}/dashboard/invitations`,
  },
  invitation_on_hold: {
    state: "ACTION_REQUIRED",
    priority: "NORMAL",
    scope: "user",
    category: "MEMBERSHIP",
    defaultRecipients: "invitee_by_email",
    metadataSchema: invitationPayloadSchema,
    dedupeKey: (ctx) => `invite:on_hold:${ctx.payload.invitationId}`,
    href: invitationHref,
  },
  invitation_released: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "MEMBERSHIP",
    defaultRecipients: "invitee_by_email",
    metadataSchema: invitationPayloadSchema,
    dedupeKey: (ctx) => `invite:released:${ctx.payload.invitationId}`,
    href: invitationHref,
  },
  member_removed: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "MEMBERSHIP",
    defaultRecipients: "explicit_user_ids",
    metadataSchema: z.object({ workspaceName: z.string() }),
    dedupeKey: (ctx) => `member:removed:${ctx.workspaceId}:${ctx.userIds?.[0]}`,
    href: (ctx) => `/${ctx.locale}/dashboard`,
  },
  member_suspended_seat: {
    state: "ACTION_REQUIRED",
    priority: "HIGH",
    scope: "user",
    category: "MEMBERSHIP",
    defaultRecipients: "explicit_user_ids",
    metadataSchema: billingWorkspacePayloadSchema,
    dedupeKey: (ctx) => `member:suspended:seat:${ctx.workspaceId}:${ctx.userIds?.[0]}`,
    href: (ctx) => workspaceBillingHref(ctx, "billing/plans"),
  },
  member_suspended_unpaid: {
    state: "ACTION_REQUIRED",
    priority: "HIGH",
    scope: "user",
    category: "MEMBERSHIP",
    defaultRecipients: "explicit_user_ids",
    metadataSchema: billingWorkspacePayloadSchema,
    dedupeKey: (ctx) => `member:suspended:unpaid:${ctx.workspaceId}:${ctx.userIds?.[0]}`,
    href: (ctx) => workspaceBillingHref(ctx, "billing"),
  },
  member_reactivated: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "MEMBERSHIP",
    defaultRecipients: "explicit_user_ids",
    metadataSchema: billingWorkspacePayloadSchema,
    dedupeKey: (ctx) => `member:reactivated:${ctx.workspaceId}:${ctx.userIds?.[0]}`,
    href: (ctx) => dashboardEstimatesHref(ctx.locale as Locale, ctx.workspaceSlug),
  },
  ownership_transfer_received: {
    state: "ACTION_REQUIRED",
    priority: "HIGH",
    scope: "user",
    category: "MEMBERSHIP",
    defaultRecipients: "explicit_user_ids",
    metadataSchema: transferPayloadSchema.extend({ transferToken: z.string() }),
    dedupeKey: (ctx) => `transfer:${ctx.payload.transferId}`,
    href: transferHref,
  },
  ownership_transfer_accepted: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "MEMBERSHIP",
    defaultRecipients: "explicit_user_ids",
    metadataSchema: transferPayloadSchema,
    dedupeKey: (ctx) => `transfer:accepted:${ctx.payload.transferId}`,
    href: (ctx) => `/${ctx.locale}/dashboard`,
  },
  ownership_transfer_declined: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "MEMBERSHIP",
    defaultRecipients: "explicit_user_ids",
    metadataSchema: transferPayloadSchema,
    dedupeKey: (ctx) => `transfer:declined:${ctx.payload.transferId}`,
    href: (ctx) => `/${ctx.locale}/dashboard`,
  },
  ownership_transfer_expired: {
    state: "ACTION_REQUIRED",
    priority: "HIGH",
    scope: "user",
    category: "MEMBERSHIP",
    defaultRecipients: "explicit_user_ids",
    metadataSchema: transferPayloadSchema,
    dedupeKey: (ctx) => `transfer:expired:${ctx.payload.transferId}`,
    href: (ctx) => `/${ctx.locale}/dashboard`,
  },
  subscription_past_due: {
    state: "ACTION_REQUIRED",
    priority: "HIGH",
    scope: "user",
    category: "BILLING",
    defaultRecipients: "billing_payer",
    metadataSchema: billingWorkspacePayloadSchema,
    dedupeKey: (ctx) => `billing:past_due:${ctx.payload.workspaceId}`,
    href: (ctx) => workspaceBillingHref(ctx),
    primaryAction: (ctx) => ({
      labelKey: "notifications.actions.manageBilling",
      href: workspaceBillingHref(ctx),
    }),
    resolveWhen: "subscription_active",
  },
  subscription_grace_period: {
    state: "ACTION_REQUIRED",
    priority: "HIGH",
    scope: "user",
    category: "BILLING",
    defaultRecipients: "workspace_owner",
    metadataSchema: billingWorkspacePayloadSchema,
    dedupeKey: (ctx) => `billing:grace:${ctx.payload.workspaceId}`,
    href: (ctx) => workspaceBillingHref(ctx),
    resolveWhen: "subscription_active",
  },
  subscription_expired: {
    state: "ACTION_REQUIRED",
    priority: "HIGH",
    scope: "user",
    category: "BILLING",
    defaultRecipients: "workspace_owner",
    metadataSchema: billingWorkspacePayloadSchema,
    dedupeKey: (ctx) => `billing:expired:${ctx.payload.workspaceId}`,
    href: (ctx) => workspaceBillingHref(ctx, "billing/plans"),
    primaryAction: (ctx) => ({
      labelKey: "notifications.actions.extendPlan",
      href: workspaceBillingHref(ctx, "billing/plans"),
    }),
    resolveWhen: "subscription_active",
  },
  subscription_renewal_soon: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "BILLING",
    defaultRecipients: "workspace_owner",
    metadataSchema: subscriptionRenewalPayloadSchema,
    dedupeKey: (ctx) =>
      `billing:renewal_soon:${ctx.payload.workspaceId}:${ctx.payload.periodEndIso}`,
    href: (ctx) => workspaceBillingHref(ctx),
  },
  subscription_cancel_scheduled: {
    state: "INFO",
    priority: "LOW",
    scope: "user",
    category: "BILLING",
    defaultRecipients: "workspace_owner",
    metadataSchema: billingWorkspacePayloadSchema,
    dedupeKey: (ctx) => `billing:cancel_scheduled:${ctx.payload.workspaceId}`,
    href: (ctx) => workspaceBillingHref(ctx),
  },
  subscription_resumed: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "BILLING",
    defaultRecipients: "workspace_owner",
    metadataSchema: billingWorkspacePayloadSchema,
    dedupeKey: (ctx) => `billing:resumed:${ctx.payload.workspaceId}:${Date.now()}`,
    href: (ctx) => workspaceBillingHref(ctx),
  },
  plan_downgrade_scheduled: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "BILLING",
    defaultRecipients: "workspace_owner",
    metadataSchema: billingWorkspacePayloadSchema.extend({
      effectiveAtIso: z.string(),
    }),
    dedupeKey: (ctx) => `billing:downgrade_scheduled:${ctx.payload.workspaceId}`,
    href: (ctx) => workspaceBillingHref(ctx, "billing/plans"),
  },
  checkout_completed: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "BILLING",
    defaultRecipients: "workspace_owner",
    metadataSchema: billingWorkspacePayloadSchema.extend({
      checkoutSessionId: z.string().optional(),
    }),
    dedupeKey: (ctx) =>
      `billing:checkout:${ctx.payload.workspaceId}:${ctx.payload.checkoutSessionId ?? "session"}`,
    href: (ctx) => workspaceBillingHref(ctx),
  },
  workspace_provisioning_incomplete: {
    state: "ACTION_REQUIRED",
    priority: "HIGH",
    scope: "user",
    category: "BILLING",
    defaultRecipients: "workspace_owner",
    metadataSchema: billingWorkspacePayloadSchema,
    dedupeKey: (ctx) => `billing:provisioning:${ctx.payload.workspaceId}`,
    href: (ctx) => workspaceBillingHref(ctx, "billing/plans"),
  },
  estimate_limit_near: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "BILLING",
    defaultRecipients: "workspace_owner",
    metadataSchema: estimateLimitPayloadSchema,
    dedupeKey: (ctx) => `limits:estimate_near:${ctx.payload.workspaceId}`,
    href: (ctx) => workspaceBillingHref(ctx, "billing/plans"),
  },
  estimate_limit_reached: {
    state: "ACTION_REQUIRED",
    priority: "HIGH",
    scope: "user",
    category: "BILLING",
    defaultRecipients: "workspace_owner",
    metadataSchema: estimateLimitPayloadSchema,
    dedupeKey: (ctx) => `limits:estimate_reached:${ctx.payload.workspaceId}`,
    href: (ctx) => workspaceBillingHref(ctx, "billing/plans"),
  },
  estimate_request_submitted: {
    state: "INFO",
    priority: "LOW",
    scope: "workspace",
    category: "ESTIMATES",
    defaultRecipients: "workspace_owner",
    metadataSchema: requestPayloadSchema,
    dedupeKey: (ctx) => `request:${ctx.payload.requestId}:submitted`,
    href: requestHref,
  },
  estimate_request_queued_manual: {
    state: "ACTION_REQUIRED",
    priority: "HIGH",
    scope: "workspace",
    category: "ESTIMATES",
    defaultRecipients: "workspace_owner",
    metadataSchema: requestPayloadSchema,
    dedupeKey: (ctx) => `request:${ctx.payload.requestId}:queued`,
    href: requestHref,
    primaryAction: (ctx) => ({
      labelKey: "notifications.actions.viewRequest",
      href: requestHref(ctx),
    }),
    resolveWhen: "request_linked",
  },
  estimate_request_ai_completed: {
    state: "INFO",
    priority: "LOW",
    scope: "workspace",
    category: "ESTIMATES",
    defaultRecipients: "workspace_owner",
    metadataSchema: requestPayloadSchema,
    dedupeKey: (ctx) => `trigger:ai_completed:${ctx.payload.requestId}`,
    href: requestHref,
  },
  estimate_request_ai_failed: {
    state: "ACTION_REQUIRED",
    priority: "HIGH",
    scope: "workspace",
    category: "ESTIMATES",
    defaultRecipients: "workspace_owner",
    metadataSchema: requestPayloadSchema,
    dedupeKey: (ctx) => `trigger:ai_failed:${ctx.payload.requestId}`,
    href: requestHref,
    primaryAction: (ctx) => ({
      labelKey: "notifications.actions.retryOrConvert",
      href: requestHref(ctx),
    }),
    resolveWhen: "request_linked",
  },
  referral_signup_pending: {
    state: "INFO",
    priority: "LOW",
    scope: "user",
    category: "REFERRALS",
    defaultRecipients: "referrer_user",
    metadataSchema: referralPayloadSchema,
    dedupeKey: (ctx) => `referral:signup:${ctx.payload.referralId}`,
    href: (ctx) => `/${ctx.locale}/dashboard/referrals`,
  },
  referral_activated: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "REFERRALS",
    defaultRecipients: "referrer_user",
    metadataSchema: referralPayloadSchema,
    dedupeKey: (ctx) => `referral:activated:${ctx.payload.referralId}`,
    href: (ctx) => `/${ctx.locale}/dashboard/referrals`,
  },
  referral_reward_granted: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "REFERRALS",
    defaultRecipients: "referrer_user",
    metadataSchema: referralPayloadSchema,
    dedupeKey: (ctx) => `referral:reward:${ctx.payload.referralId}`,
    href: (ctx) => `/${ctx.locale}/dashboard/referrals`,
  },
  referral_reward_failed: {
    state: "ACTION_REQUIRED",
    priority: "HIGH",
    scope: "user",
    category: "REFERRALS",
    defaultRecipients: "referrer_user",
    metadataSchema: referralPayloadSchema,
    dedupeKey: (ctx) => `referral:reward_failed:${ctx.payload.referralId}`,
    href: (ctx) => `/${ctx.locale}/dashboard/referrals`,
    resolveWhen: "referral_reward_granted",
  },
  issue_status_changed: {
    state: "INFO",
    priority: "NORMAL",
    scope: "user",
    category: "QA",
    defaultRecipients: "platform_role_qa_testers",
    metadataSchema: issueStatusPayloadSchema,
    dedupeKey: (ctx) => `issue:status:${ctx.payload.issueNumber}:${ctx.payload.newStatus}`,
    href: (ctx) => `/${ctx.locale}/dashboard/qa/issues/${ctx.payload.issueNumber}`,
  },
} as const satisfies Record<string, NotificationTypeDefinition>;

export type CatalogNotificationType = keyof typeof NOTIFICATION_TYPE_CATALOG;

// PlatformNotificationCatalog — future admin notification stream

export function getNotificationCategory(
  type: CatalogNotificationType,
): NotificationPreferenceCategory {
  return NOTIFICATION_TYPE_CATALOG[type].category;
}
