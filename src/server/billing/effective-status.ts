import { cache } from "react";
import type {
  SubscriptionStatus,
  WorkspaceProvisioningStatus,
} from "@prisma/client";

import { prisma } from "@/db/client";
import type { WorkspaceEffectiveStatus } from "@/server/permissions/domain";

/**
 * Raw inputs to the effective-status derivation. These are the ONLY place where
 * `Subscription.status` (and grace/period dates + workspace lifecycle flags) are interpreted.
 */
export type WorkspaceStatusInput = {
  deletedAt: Date | null;
  archivedAt: Date | null;
  platformSuspendedAt: Date | null;
  provisioningStatus: WorkspaceProvisioningStatus;
  subscriptionStatus: SubscriptionStatus | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  graceEndsAt: Date | null;
};

/**
 * Pure derivation of the single authoritative {@link WorkspaceEffectiveStatus}.
 *
 * Precedence (highest first): pending deletion > platform suspension > voluntary archive >
 * incomplete provisioning > billing lifecycle. No subsystem should re-interpret these inputs.
 */
export function deriveWorkspaceEffectiveStatus(
  input: WorkspaceStatusInput,
  now: Date = new Date(),
): WorkspaceEffectiveStatus {
  if (input.deletedAt) {
    return "PENDING_DELETION";
  }
  if (input.platformSuspendedAt) {
    return "SUSPENDED";
  }
  if (input.archivedAt) {
    return "ARCHIVED";
  }
  if (input.provisioningStatus === "INCOMPLETE") {
    return "INCOMPLETE";
  }

  const graceExpired = input.graceEndsAt !== null && input.graceEndsAt.getTime() <= now.getTime();

  switch (input.subscriptionStatus) {
    case null:
    case "ACTIVE":
    case "TRIAL":
      return "ACTIVE";
    case "PAST_DUE":
      return "PAST_DUE";
    case "GRACE_PERIOD":
      return graceExpired ? "EXPIRED" : "GRACE_PERIOD";
    case "CANCELED": {
      // Cancel-at-period-end: still usable until the paid period ends, then winds down.
      if (input.cancelAtPeriodEnd && input.currentPeriodEnd && input.currentPeriodEnd.getTime() > now.getTime()) {
        return "ACTIVE";
      }
      if (input.graceEndsAt && !graceExpired) {
        return "GRACE_PERIOD";
      }
      return "EXPIRED";
    }
    case "EXPIRED":
    case "INACTIVE":
      return "EXPIRED";
    default:
      return "ACTIVE";
  }
}

/**
 * Loads a workspace's billing/lifecycle inputs and returns the derived effective status.
 * Request-scope memoized so the many guards/UI surfaces in one render share a single read.
 */
export const getWorkspaceEffectiveStatus = cache(
  async (workspaceId: string): Promise<WorkspaceEffectiveStatus | null> => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        deletedAt: true,
        archivedAt: true,
        platformSuspendedAt: true,
        provisioningStatus: true,
        billingAccount: {
          select: {
            subscription: {
              select: {
                status: true,
                cancelAtPeriodEnd: true,
                currentPeriodEnd: true,
                graceEndsAt: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return null;
    }

    const sub = workspace.billingAccount?.subscription ?? null;

    return deriveWorkspaceEffectiveStatus({
      deletedAt: workspace.deletedAt,
      archivedAt: workspace.archivedAt,
      platformSuspendedAt: workspace.platformSuspendedAt,
      provisioningStatus: workspace.provisioningStatus,
      subscriptionStatus: sub?.status ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      graceEndsAt: sub?.graceEndsAt ?? null,
    });
  },
);
