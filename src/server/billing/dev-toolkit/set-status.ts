import type { SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/db/client";
import { assertDevBillingCliEnabled } from "@/server/billing/dev-toolkit/guard";
import { loadWorkspaceBySlug } from "@/server/billing/dev-toolkit/load-workspace";
import { recomputeIsActiveFree } from "@/server/billing/workspace-billing-maintenance";

export type DevLifecycleStatus = "ACTIVE" | "PAST_DUE" | "GRACE_PERIOD" | "EXPIRED";

const VALID_STATUSES: DevLifecycleStatus[] = ["ACTIVE", "PAST_DUE", "GRACE_PERIOD", "EXPIRED"];

export function parseDevLifecycleStatus(value: string): DevLifecycleStatus {
  const status = value.toUpperCase() as DevLifecycleStatus;
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(
      `Invalid status "${value}". Use ACTIVE, PAST_DUE, GRACE_PERIOD, or EXPIRED.`,
    );
  }
  return status;
}

export type SetWorkspaceLifecycleResult = {
  slug: string;
  subscriptionStatus: SubscriptionStatus;
  graceEndsAt: Date | null;
};

/** Writes subscription fields consumed by deriveWorkspaceEffectiveStatus. */
export async function devSetWorkspaceLifecycleStatus(
  slug: string,
  target: DevLifecycleStatus,
): Promise<SetWorkspaceLifecycleResult> {
  assertDevBillingCliEnabled();

  const workspace = await loadWorkspaceBySlug(slug);

  if (!workspace.subscription) {
    throw new Error(`Workspace "${slug}" has no subscription row.`);
  }

  const graceEndsAt =
    target === "GRACE_PERIOD" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;

  const data: {
    status: SubscriptionStatus;
    graceEndsAt: Date | null;
    cancelAtPeriodEnd?: boolean;
  } = {
    status: target,
    graceEndsAt,
  };

  if (target === "ACTIVE" || target === "EXPIRED") {
    data.cancelAtPeriodEnd = false;
    if (target === "ACTIVE") {
      data.graceEndsAt = null;
    }
  }

  await prisma.subscription.update({
    where: { id: workspace.subscription.id },
    data,
  });

  await recomputeIsActiveFree(workspace.id);

  return {
    slug: workspace.slug,
    subscriptionStatus: target,
    graceEndsAt: target === "GRACE_PERIOD" ? graceEndsAt : null,
  };
}
