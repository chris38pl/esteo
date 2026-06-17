import "server-only";

import { prisma } from "@/db/client";
import { getWorkspaceEffectiveStatus } from "@/server/billing/effective-status";
import { WorkspaceError } from "@/server/permissions/errors";

import {
  evaluateTransferEligibility,
  type LiveSubscriptionForTransfer,
  type TransferEligibilitySnapshot,
  transferEligibilityErrorMessage,
} from "@/features/workspaces/lib/transfer-eligibility-logic";

export type {
  LiveSubscriptionForTransfer,
  TransferEligibilityBlockReason,
  TransferEligibilitySnapshot,
} from "@/features/workspaces/lib/transfer-eligibility-logic";

export async function loadLiveSubscriptionForTransfer(
  workspaceId: string,
): Promise<LiveSubscriptionForTransfer | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId, deletedAt: null },
    select: {
      billingAccount: {
        select: {
          subscription: {
            select: {
              plan: true,
              cancelAtPeriodEnd: true,
              currentPeriodEnd: true,
            },
          },
        },
      },
    },
  });

  const subscription = workspace?.billingAccount?.subscription;
  if (!subscription) {
    return null;
  }

  return {
    plan: subscription.plan,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodEnd: subscription.currentPeriodEnd,
  };
}

export async function getTransferEligibilitySnapshot(
  workspaceId: string,
): Promise<TransferEligibilitySnapshot> {
  const [subscription, effectiveStatus, pendingTransfer] = await Promise.all([
    loadLiveSubscriptionForTransfer(workspaceId),
    getWorkspaceEffectiveStatus(workspaceId),
    prisma.workspaceOwnershipTransfer.findFirst({
      where: { workspaceId, status: "PENDING_RECIPIENT" },
      select: { id: true },
    }),
  ]);

  return evaluateTransferEligibility({
    subscription,
    effectiveStatus,
    hasPendingTransfer: Boolean(pendingTransfer),
  });
}

export async function getTransferAcceptanceSnapshot(
  workspaceId: string,
): Promise<TransferEligibilitySnapshot> {
  const [subscription, effectiveStatus] = await Promise.all([
    loadLiveSubscriptionForTransfer(workspaceId),
    getWorkspaceEffectiveStatus(workspaceId),
  ]);

  return evaluateTransferEligibility({
    subscription,
    effectiveStatus,
    hasPendingTransfer: false,
  });
}

export async function assertTransferEligible(workspaceId: string): Promise<TransferEligibilitySnapshot> {
  const snapshot = await getTransferEligibilitySnapshot(workspaceId);

  if (!snapshot.eligible) {
    throw new WorkspaceError(transferEligibilityErrorMessage(snapshot.blockReason));
  }

  return snapshot;
}

export async function assertTransferAcceptable(
  workspaceId: string,
): Promise<TransferEligibilitySnapshot> {
  const snapshot = await getTransferAcceptanceSnapshot(workspaceId);

  if (!snapshot.eligible) {
    throw new WorkspaceError(transferEligibilityErrorMessage(snapshot.blockReason));
  }

  return snapshot;
}
