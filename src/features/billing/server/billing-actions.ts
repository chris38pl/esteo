"use server";

import type { SubscriptionPlan } from "@prisma/client";

import { BillingError } from "@/features/billing/server/billing-errors";
import {
  assertCanChangePlanOrAddons,
  assertCanManageBilling,
  assertCanPurchaseSubscription,
  assertCanResumeSubscription,
} from "@/features/billing/server/billing-permissions";
import {
  cancelAtPeriodEnd,
  changeWorkspaceAddonQuantity,
  changeWorkspaceSubscriptionPlan,
  openPortal,
  reactivate,
  type WorkspacePlanChangeResult,
} from "@/features/billing/server/billing-service";
import type {
  BillingChangePreview,
  BillingChangePreviewInput,
} from "@/features/billing/billing-page-data";
import { previewWorkspaceBillingChange } from "@/features/billing/server/preview-billing-change";
import type { Locale } from "@/lib/locale";
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

export async function changeWorkspacePlanAction(
  workspaceId: string,
  plan: SubscriptionPlan,
): Promise<ActionResult<WorkspacePlanChangeResult>> {
  try {
    const user = await requireAuthUser();
    const { resolveWorkspaceBillingPermissions } = await import(
      "@/features/billing/server/billing-permissions"
    );
    const permissions = await resolveWorkspaceBillingPermissions(user.id, workspaceId);
    if (!permissions) {
      throw new PermissionError("Workspace not found.");
    }
    if (permissions.billingOwnershipState === "HANDOFF_EXPIRED") {
      await assertCanPurchaseSubscription(user, workspaceId);
    } else {
      await assertCanChangePlanOrAddons(user, workspaceId);
    }
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

export async function openWorkspacePortalAction(
  workspaceId: string,
  locale: Locale,
): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await requireAuthUser();
    await assertCanManageBilling(user, workspaceId);
    const result = await openPortal({ workspaceId, locale });
    return { success: true, data: result };
  } catch (error) {
    return toError(error);
  }
}

export async function changeWorkspaceAddonQuantityAction(
  workspaceId: string,
  addonKey: "STORAGE" | "SEATS",
  quantity: number,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const user = await requireAuthUser();
    await assertCanChangePlanOrAddons(user, workspaceId);
    const result = await changeWorkspaceAddonQuantity({ workspaceId, addonKey, quantity });
    return { success: true, data: result };
  } catch (error) {
    return toError(error);
  }
}

export async function previewWorkspaceBillingChangeAction(
  workspaceId: string,
  change: BillingChangePreviewInput,
): Promise<ActionResult<BillingChangePreview>> {
  try {
    const user = await requireAuthUser();
    await assertCanChangePlanOrAddons(user, workspaceId);
    const preview = await previewWorkspaceBillingChange({ workspaceId, change });
    return { success: true, data: preview };
  } catch (error) {
    return toError(error);
  }
}

export async function cancelWorkspaceSubscriptionAction(
  workspaceId: string,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const user = await requireAuthUser();
    await assertCanManageBilling(user, workspaceId);
    await cancelAtPeriodEnd({ workspaceId });
    return { success: true, data: { ok: true } };
  } catch (error) {
    return toError(error);
  }
}

export async function reactivateWorkspaceSubscriptionAction(
  workspaceId: string,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const user = await requireAuthUser();
    await assertCanResumeSubscription(user, workspaceId);
    await reactivate({ workspaceId });
    return { success: true, data: { ok: true } };
  } catch (error) {
    return toError(error);
  }
}

/** Post-expiry or FREE upgrade checkout — owner only when HANDOFF_EXPIRED. */
export async function purchaseWorkspaceSubscriptionAction(
  workspaceId: string,
  plan: Exclude<SubscriptionPlan, "FREE">,
): Promise<ActionResult<WorkspacePlanChangeResult>> {
  try {
    const user = await requireAuthUser();
    await assertCanPurchaseSubscription(user, workspaceId);
    const result = await changeWorkspaceSubscriptionPlan({ workspaceId, plan });
    return { success: true, data: result };
  } catch (error) {
    return toError(error);
  }
}
