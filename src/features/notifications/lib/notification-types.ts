import type {
  NotificationPreferenceCategory,
  NotificationPriority,
  NotificationState,
  NotificationType,
} from "@prisma/client";

export type { NotificationType, NotificationState, NotificationPriority, NotificationPreferenceCategory };

export type NotificationScope = "workspace" | "user";

export type RecipientToken =
  | "workspace_owner"
  | "workspace_owner_and_estimators"
  | "workspace_members"
  | "billing_payer"
  | "invitee_by_email"
  | "referrer_user"
  | "platform_role_qa_testers"
  | "explicit_user_ids";

export type NotificationActionDef = {
  labelKey: string;
  href: string;
};

export type EmitContext = {
  locale: string;
  actorUserId?: string | null;
  workspaceId?: string;
  workspaceSlug?: string;
  inviteeEmail?: string;
  referrerUserId?: string;
  userIds?: string[];
  payload: Record<string, unknown>;
};

export type NotificationListItem = {
  id: string;
  type: NotificationType;
  state: NotificationState;
  priority: NotificationPriority;
  href: string;
  primaryActionLabelKey: string | null;
  primaryActionHref: string | null;
  secondaryActionLabelKey: string | null;
  secondaryActionHref: string | null;
  payload: unknown;
  readAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  workspaceId: string | null;
  workspaceName: string | null;
};

export type NotificationCounts = {
  total: number;
  actionRequired: number;
};
