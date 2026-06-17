"use server";

import type { SubscriptionPlan } from "@prisma/client";

import { BillingError } from "@/features/billing/server/billing-errors";
import {
  cancelAtPeriodEnd,
  changeWorkspaceAddonQuantity,
  changeWorkspaceSubscriptionPlan,
  openPortal,
  reactivate,
  type WorkspacePlanChangeResult,
} from "@/features/billing/server/billing-service";
import { requireBillingPayer } from "@/features/billing/server/billing-permissions";
import { syncUserFromClerk } from "@/server/auth/sync-user";
import { PermissionError, WorkspaceError } from "@/server/permissions/errors";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function toError(error: unknown): ActionResult<never> {
  if (
    error instanceof PermissionError ||
    error instanceof WorkspaceError ||
    error instanceof BillingError
  ) {
    return { success: false, error: error.message };
  }
  console.error("[billing-actions]", error);
  return { success: false, error: "Something went wrong." };
}

async function requireAuthUser() {
  const user = await syncUserFromClerk();
  if (!user) {
    throw new PermissionError("Authentication required.");
  }
  return user;
}

/** Billing payer only: single entrypoint for all workspace plan changes. */
export async function changeWorkspacePlanAction(
  workspaceId: string,
  plan: SubscriptionPlan,
): Promise<ActionResult<WorkspacePlanChangeResult>> {
  try {
    const user = await requireAuthUser();
    await requireBillingPayer(user, workspaceId);
    const result = await changeWorkspaceSubscriptionPlan({ workspaceId, plan });
    return { success: true, data: result };
  } catch (error) {
    return toError(error);
  }
}

/** @deprecated Use changeWorkspacePlanAction. */
export async function startWorkspaceCheckoutAction(
  workspaceId: string,
  plan: Exclude<SubscriptionPlan, "FREE">,
): Promise<ActionResult<WorkspacePlanChangeResult>> {
  return changeWorkspacePlanAction(workspaceId, plan);
}

/** Billing payer only: opens the Stripe billing portal for a workspace. */
export async function openWorkspacePortalAction(
  workspaceId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await requireAuthUser();
    await requireBillingPayer(user, workspaceId);
    const result = await openPortal({ workspaceId });
    return { success: true, data: result };
  } catch (error) {
    return toError(error);
  }
}

/** Billing payer only: update a quantity-based add-on (storage or seats). */
export async function changeWorkspaceAddonQuantityAction(
  workspaceId: string,
  addonKey: "STORAGE" | "SEATS",
  quantity: number,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const user = await requireAuthUser();
    await requireBillingPayer(user, workspaceId);
    const result = await changeWorkspaceAddonQuantity({ workspaceId, addonKey, quantity });
    return { success: true, data: result };
  } catch (error) {
    return toError(error);
  }
}

export async function cancelWorkspaceSubscriptionAction(
  workspaceId: string,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const user = await requireAuthUser();
    await requireBillingPayer(user, workspaceId);
    await cancelAtPeriodEnd({ workspaceId });
    return { success: true, data: { ok: true } };
  } catch (error) {
    return toError(error);
  }
}

/** Billing payer only: undo a scheduled cancellation. */
export async function reactivateWorkspaceSubscriptionAction(
  workspaceId: string,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const user = await requireAuthUser();
    await requireBillingPayer(user, workspaceId);
    await reactivate({ workspaceId });
    return { success: true, data: { ok: true } };
  } catch (error) {
    return toError(error);
  }
}
