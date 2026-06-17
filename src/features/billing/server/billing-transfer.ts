import { prisma } from "@/db/client";
import { resolveEffectivePayerUserId } from "@/features/billing/lib/billing-permissions-logic";
import { PermissionError, WorkspaceError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";
import type { User } from "@prisma/client";

export type BillingTransferState = "NONE" | "PENDING" | "COMPLETED";

/**
 * Returns whether the workspace payer differs from the workspace owner (interim state after
 * ownership transfer before billing handoff completes).
 */
export async function getBillingTransferState(workspaceId: string): Promise<{
  ownerId: string;
  payerUserId: string | null;
  state: BillingTransferState;
}> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      ownerId: true,
      billingAccount: { select: { payerUserId: true } },
    },
  });

  if (!workspace?.billingAccount) {
    throw new WorkspaceError("Workspace billing not found.");
  }

  const payerUserId = resolveEffectivePayerUserId(
    workspace.billingAccount.payerUserId,
    workspace.ownerId,
  );
  const differs = payerUserId !== workspace.ownerId;

  return {
    ownerId: workspace.ownerId,
    payerUserId,
    state: differs ? "PENDING" : "NONE",
  };
}

/**
 * Initiates billing transfer to a new payer. V1: records the intended payer; the new payer must
 * complete checkout (creating their own Stripe subscription) before the old subscription is cancelled.
 * Stripe subscriptions cannot move between customers — cancel + recreate is required.
 */
export async function initiateBillingTransfer(
  actor: User,
  workspaceId: string,
  newPayerUserId: string,
): Promise<{ payerUserId: string }> {
  await requireRole(actor, workspaceId, "OWNER");

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true, billingAccount: { select: { id: true } } },
  });

  if (!workspace?.billingAccount) {
    throw new WorkspaceError("Workspace billing not found.");
  }

  if (newPayerUserId === workspace.ownerId) {
    await prisma.billingAccount.update({
      where: { id: workspace.billingAccount.id },
      data: { payerUserId: workspace.ownerId },
    });
    return { payerUserId: workspace.ownerId };
  }

  const newPayer = await prisma.user.findUnique({ where: { id: newPayerUserId } });
  if (!newPayer) {
    throw new WorkspaceError("New payer user not found.");
  }

  const isMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: newPayerUserId, deletedAt: null, state: "ACTIVE" },
  });

  if (!isMember) {
    throw new PermissionError("Billing payer must be an active workspace member.");
  }

  await prisma.billingAccount.update({
    where: { id: workspace.billingAccount.id },
    data: { payerUserId: newPayerUserId },
  });

  return { payerUserId: newPayerUserId };
}
