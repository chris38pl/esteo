import type Stripe from "stripe";

import { getStripeClient } from "@/features/billing/server/stripe-client";
import { extractStripePriceId, planFromPriceId } from "@/features/billing/server/stripe-plan-utils";

export type DuplicateSubscriptionGroup = {
  workspaceId: string;
  workspaceSlug: string | null;
  stripeCustomerId: string;
  dbStripeSubscriptionId: string | null;
  dbPlan: string | null;
  subscriptions: Array<{
    id: string;
    status: Stripe.Subscription.Status;
    created: number;
    priceId: string | null;
    plan: string | null;
    metadataPlan: string | null;
  }>;
};

const ACTIVE_LIKE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
]);

export async function findDuplicateSubscriptionGroups(): Promise<DuplicateSubscriptionGroup[]> {
  const { prisma } = await import("@/db/client");
  const stripe = getStripeClient();

  const workspaces = await prisma.workspace.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      slug: true,
      billingAccount: {
        select: {
          billingCustomer: { select: { stripeCustomerId: true } },
          subscription: {
            select: {
              plan: true,
              stripeSubscriptionId: true,
            },
          },
        },
      },
    },
  });

  const groups: DuplicateSubscriptionGroup[] = [];

  for (const workspace of workspaces) {
    const stripeCustomerId = workspace.billingAccount?.billingCustomer?.stripeCustomerId;
    if (!stripeCustomerId) {
      continue;
    }

    const { data: subscriptions } = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 100,
    });

    const workspaceSubscriptions = subscriptions.filter(
      (subscription) =>
        subscription.metadata.workspaceId === workspace.id &&
        ACTIVE_LIKE_STATUSES.has(subscription.status),
    );

    if (workspaceSubscriptions.length <= 1) {
      continue;
    }

    groups.push({
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
      stripeCustomerId,
      dbStripeSubscriptionId:
        workspace.billingAccount?.subscription?.stripeSubscriptionId ?? null,
      dbPlan: workspace.billingAccount?.subscription?.plan ?? null,
      subscriptions: workspaceSubscriptions
        .map((subscription) => {
          const priceId = extractStripePriceId(subscription.items.data[0]);
          return {
            id: subscription.id,
            status: subscription.status,
            created: subscription.created,
            priceId,
            plan: planFromPriceId(priceId),
            metadataPlan: subscription.metadata.plan ?? null,
          };
        })
        .sort((left, right) => right.created - left.created),
    });
  }

  return groups;
}

export async function listActiveLikeStripeSubscriptionsForWorkspace(params: {
  workspaceId: string;
  stripeCustomerId: string;
}): Promise<Stripe.Subscription[]> {
  const stripe = getStripeClient();

  const { data: subscriptions } = await stripe.subscriptions.list({
    customer: params.stripeCustomerId,
    status: "all",
    limit: 100,
  });

  return subscriptions.filter(
    (subscription) =>
      subscription.metadata.workspaceId === params.workspaceId &&
      ACTIVE_LIKE_STATUSES.has(subscription.status),
  );
}

export function pickCanonicalSubscriptionId(
  group: DuplicateSubscriptionGroup,
): string {
  return group.subscriptions[0]?.id ?? "";
}
