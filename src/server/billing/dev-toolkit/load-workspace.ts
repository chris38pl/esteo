import { prisma } from "@/db/client";

export type LoadedWorkspaceBilling = {
  id: string;
  slug: string;
  ownerEmail: string;
  isActiveFree: boolean;
  provisioningStatus: string;
  attachmentStorageUsedBytes: bigint;
  attachmentStorageLimitBytes: bigint;
  billingAccountId: string;
  subscription: {
    id: string;
    plan: string;
    planVersion: string | null;
    status: string;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    stripePriceId: string | null;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: Date | null;
    graceEndsAt: Date | null;
  } | null;
  stripeCustomerId: string | null;
};

export async function loadWorkspaceBySlug(slug: string): Promise<LoadedWorkspaceBilling> {
  const workspace = await prisma.workspace.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      slug: true,
      isActiveFree: true,
      provisioningStatus: true,
      attachmentStorageUsedBytes: true,
      attachmentStorageLimitBytes: true,
      billingAccountId: true,
      owner: { select: { email: true } },
      billingAccount: {
        select: {
          id: true,
          billingCustomer: { select: { stripeCustomerId: true } },
          subscription: {
            select: {
              id: true,
              plan: true,
              planVersion: true,
              status: true,
              stripeSubscriptionId: true,
              stripeCustomerId: true,
              stripePriceId: true,
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
    throw new Error(`Workspace not found for slug "${slug}".`);
  }

  return {
    id: workspace.id,
    slug: workspace.slug,
    ownerEmail: workspace.owner.email,
    isActiveFree: workspace.isActiveFree,
    provisioningStatus: workspace.provisioningStatus,
    attachmentStorageUsedBytes: workspace.attachmentStorageUsedBytes,
    attachmentStorageLimitBytes: workspace.attachmentStorageLimitBytes,
    billingAccountId: workspace.billingAccountId,
    subscription: workspace.billingAccount?.subscription ?? null,
    stripeCustomerId:
      workspace.billingAccount?.billingCustomer?.stripeCustomerId ??
      workspace.billingAccount?.subscription?.stripeCustomerId ??
      null,
  };
}
