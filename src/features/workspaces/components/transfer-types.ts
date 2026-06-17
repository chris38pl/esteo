import type { SubscriptionPlan } from "@prisma/client";

export type TransferEligibilityView = {
  eligible: boolean;
  blockReason:
    | "CANCEL_SUBSCRIPTION_REQUIRED"
    | "NO_PAID_PERIOD"
    | "WORKSPACE_NOT_ACTIVE"
    | "FREE_PLAN"
    | "PENDING_TRANSFER_EXISTS"
    | null;
  plan: SubscriptionPlan;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  effectiveStatus: string | null;
};

export type PendingOutboundTransferView = {
  id: string;
  toEmail: string;
  expiresAt: string;
  keepSenderAsMember: boolean;
  planSnapshot: SubscriptionPlan;
  periodEndSnapshot: string;
};

export type ReceivedOwnershipTransferView = {
  id: string;
  token: string;
  expiresAt: string;
  planSnapshot: SubscriptionPlan;
  periodEndSnapshot: string;
  keepSenderAsMember: boolean;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  fromUser: {
    name: string | null;
    email: string;
  };
};

export function toReceivedOwnershipTransferView(
  transfer: {
    id: string;
    token: string;
    expiresAt: Date;
    planSnapshot: SubscriptionPlan;
    periodEndSnapshot: Date;
    keepSenderAsMember: boolean;
    workspace: { id: string; name: string; slug: string };
    fromUser: { name: string | null; email: string };
  },
): ReceivedOwnershipTransferView {
  return {
    id: transfer.id,
    token: transfer.token,
    expiresAt: transfer.expiresAt.toISOString(),
    planSnapshot: transfer.planSnapshot,
    periodEndSnapshot: transfer.periodEndSnapshot.toISOString(),
    keepSenderAsMember: transfer.keepSenderAsMember,
    workspace: transfer.workspace,
    fromUser: transfer.fromUser,
  };
}
