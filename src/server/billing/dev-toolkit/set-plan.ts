import type { SubscriptionPlan } from "@prisma/client";

import { prisma } from "@/db/client";
import { assertDevBillingCliEnabled } from "@/server/billing/dev-toolkit/guard";
import { loadWorkspaceBySlug } from "@/server/billing/dev-toolkit/load-workspace";
import { defaultPlanVersion, resolvePlanLimits } from "@/server/billing/plan-catalog";
import { recomputeIsActiveFree } from "@/server/billing/workspace-billing-maintenance";

const VALID_PLANS: SubscriptionPlan[] = ["FREE", "PRO", "BUSINESS"];

export function parseDevPlan(value: string): SubscriptionPlan {
  const plan = value.toUpperCase() as SubscriptionPlan;
  if (!VALID_PLANS.includes(plan)) {
    throw new Error(`Invalid plan "${value}". Use FREE, PRO, or BUSINESS.`);
  }
  return plan;
}

export type SetWorkspacePlanResult = {
  slug: string;
  plan: SubscriptionPlan;
  planVersion: string;
};

/** Fast DB-only plan change for UI testing. Does not interact with Stripe. */
export async function devSetWorkspacePlan(
  slug: string,
  plan: SubscriptionPlan,
): Promise<SetWorkspacePlanResult> {
  assertDevBillingCliEnabled();

  const workspace = await loadWorkspaceBySlug(slug);
  const planVersion = defaultPlanVersion(plan);
  const limits = resolvePlanLimits(plan, planVersion);

  if (workspace.subscription) {
    await prisma.subscription.update({
      where: { id: workspace.subscription.id },
      data: {
        plan,
        planVersion,
        status: "ACTIVE",
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        billingAccountId: workspace.billingAccountId,
        plan,
        planVersion,
        status: "ACTIVE",
      },
    });
  }

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { attachmentStorageLimitBytes: BigInt(limits.maxStorageBytes) },
  });

  await recomputeIsActiveFree(workspace.id);

  return { slug: workspace.slug, plan, planVersion };
}
