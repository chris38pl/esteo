import { prisma } from "@/db/client";
import { resolvePlanLimits } from "@/server/billing/plan-catalog";

/**
 * Keeps `Workspace.attachmentStorageLimitBytes` aligned with the workspace's pinned plan version.
 * Called after subscription/plan changes. Never deletes files — only updates the limit ceiling.
 */
export async function syncWorkspaceStorageLimitFromPlan(workspaceId: string): Promise<void> {
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
  const limits = resolvePlanLimits(sub?.plan ?? "FREE", sub?.planVersion ?? null);

  if (workspace.attachmentStorageLimitBytes === BigInt(limits.maxStorageBytes)) {
    return;
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { attachmentStorageLimitBytes: BigInt(limits.maxStorageBytes) },
  });
}
