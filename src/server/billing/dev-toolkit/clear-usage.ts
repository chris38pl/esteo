import { prisma } from "@/db/client";
import { assertDevBillingCliEnabled } from "@/server/billing/dev-toolkit/guard";
import { loadWorkspaceBySlug } from "@/server/billing/dev-toolkit/load-workspace";

export type ClearWorkspaceUsageResult = {
  slug: string;
  deletedEvents: number;
  deletedAggregates: number;
  deletedBillingAccountPeriods: number;
};

export async function clearWorkspaceUsage(slug: string): Promise<ClearWorkspaceUsageResult> {
  assertDevBillingCliEnabled();

  const workspace = await loadWorkspaceBySlug(slug);

  const [deletedEvents, deletedAggregates, deletedBillingAccountPeriods] =
    await prisma.$transaction([
      prisma.usageEvent.deleteMany({ where: { workspaceId: workspace.id } }),
      prisma.usagePeriodAggregate.deleteMany({ where: { workspaceId: workspace.id } }),
      prisma.billingAccountUsagePeriod.deleteMany({
        where: { billingAccountId: workspace.billingAccountId },
      }),
    ]);

  return {
    slug: workspace.slug,
    deletedEvents: deletedEvents.count,
    deletedAggregates: deletedAggregates.count,
    deletedBillingAccountPeriods: deletedBillingAccountPeriods.count,
  };
}
