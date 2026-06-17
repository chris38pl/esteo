import { prisma } from "@/db/client";
import {
  mergePlanLimitsWithAddons,
  resolveAddonDeltas,
} from "@/server/billing/addon-catalog";
import { resolvePlanLimits } from "@/server/billing/plan-catalog";
import { reconcileSeatsAfterPlanChange } from "@/server/billing/seat-overage";

/**
 * Keeps workspace limits aligned with base plan + active add-on quantities.
 */
export async function syncWorkspaceEffectiveLimits(workspaceId: string): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      attachmentStorageLimitBytes: true,
      billingAccount: {
        select: { subscription: { select: { plan: true, planVersion: true } } },
      },
    },
  });

  if (!workspace) {
    return;
  }

  const sub = workspace.billingAccount?.subscription;
  const plan = sub?.plan ?? "FREE";
  const baseLimits = resolvePlanLimits(plan, sub?.planVersion ?? null);
  const addons = await prisma.workspaceAddon.findMany({
    where: { workspaceId, status: "ACTIVE", quantity: { gt: 0 } },
    select: { addonKey: true, quantity: true },
  });
  const deltas = resolveAddonDeltas(plan, addons);
  const effectiveLimits = mergePlanLimitsWithAddons(baseLimits, deltas);
  const nextStorageLimit = BigInt(effectiveLimits.maxStorageBytes);

  if (workspace.attachmentStorageLimitBytes !== nextStorageLimit) {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { attachmentStorageLimitBytes: nextStorageLimit },
    });
  }

  await reconcileSeatsAfterPlanChange(workspaceId);
}

/** @deprecated Use syncWorkspaceEffectiveLimits */
export async function syncWorkspaceStorageLimitFromPlan(workspaceId: string): Promise<void> {
  await syncWorkspaceEffectiveLimits(workspaceId);
}
