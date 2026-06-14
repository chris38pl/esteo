import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

import {
  assertCanCreateEstimate,
  assertCanCreateWorkspace,
  assertCanInviteMember,
  getEntitlements,
  isPaidSubscriptionStatus,
} from "@/server/permissions/entitlements";

export type EntitlementAction =
  | "create_workspace"
  | "invite_member"
  | "create_estimate";

/** Entitlement-only gate. Callers must independently satisfy RBAC. */
export async function assertEntitlement(
  action: EntitlementAction,
  context: { userId: string; workspaceId?: string },
): Promise<void> {
  switch (action) {
    case "create_workspace":
      return assertCanCreateWorkspace(context.userId);
    case "invite_member":
      if (!context.workspaceId) {
        throw new Error("workspaceId is required for invite_member entitlement.");
      }
      return assertCanInviteMember(context.workspaceId);
    case "create_estimate":
      if (!context.workspaceId) {
        throw new Error("workspaceId is required for create_estimate entitlement.");
      }
      return assertCanCreateEstimate(context.workspaceId);
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function assertPaidPlan(plan: SubscriptionPlan, status: string): void {
  if (!isPaidSubscriptionStatus(status as SubscriptionStatus)) {
    throw new Error("An active subscription is required.");
  }

  if (plan === "FREE") {
    throw new Error("This feature requires a paid plan.");
  }
}

export { getEntitlements, isPaidSubscriptionStatus };
