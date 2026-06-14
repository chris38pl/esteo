import "server-only";

import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/db/client";
import { BillingError } from "@/features/billing/server/billing-errors";
import { getStripeClient } from "@/features/billing/server/stripe-client";
import { enforceSingleActiveSubscription } from "@/features/billing/server/subscription-invariants";
import {
  extractStripePriceId,
  getSubscriptionScheduleId,
  planFromPriceId,
  priceIdForPlan,
} from "@/features/billing/server/stripe-plan-utils";
import { syncSubscriptionFromStripe } from "@/features/billing/server/subscription-sync";
import { WorkspaceError } from "@/server/permissions/errors";

export type WorkspacePlanChangeResult =
  | { kind: "noop"; plan: SubscriptionPlan }
  | { kind: "checkout"; url: string }
  | { kind: "updated"; plan: SubscriptionPlan }
  | {
      kind: "downgrade_scheduled";
      currentPlan: SubscriptionPlan;
      targetPlan: SubscriptionPlan;
      effectiveAt: string;
    }
  | { kind: "downgrade_canceled"; plan: SubscriptionPlan };

type WorkspaceSubscriptionRow = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeSubscriptionId: string | null;
};

const ACTIVE_PAID_STATUSES = new Set<SubscriptionStatus>(["ACTIVE", "TRIAL"]);

function isActivePaidSubscription(subscription: WorkspaceSubscriptionRow): boolean {
  return (
    Boolean(subscription.stripeSubscriptionId) &&
    ACTIVE_PAID_STATUSES.has(subscription.status)
  );
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

async function loadWorkspaceSubscription(
  workspaceId: string,
): Promise<WorkspaceSubscriptionRow & { slug: string }> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      slug: true,
      billingAccount: {
        select: {
          subscription: {
            select: {
              plan: true,
              status: true,
              stripeSubscriptionId: true,
            },
          },
        },
      },
    },
  });

  if (!workspace?.billingAccount?.subscription) {
    throw new WorkspaceError("Workspace has no subscription.");
  }

  return {
    slug: workspace.slug,
    plan: workspace.billingAccount.subscription.plan,
    status: workspace.billingAccount.subscription.status,
    stripeSubscriptionId: workspace.billingAccount.subscription.stripeSubscriptionId,
  };
}

async function createCheckoutSession(params: {
  workspaceId: string;
  slug: string;
  plan: Exclude<SubscriptionPlan, "FREE">;
  stripeCustomerId: string;
}): Promise<{ url: string }> {
  const stripe = getStripeClient();
  const base = appBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: params.stripeCustomerId,
    line_items: [{ price: priceIdForPlan(params.plan), quantity: 1 }],
    success_url: `${base}/dashboard/${params.slug}/billing/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/dashboard/${params.slug}/billing/plans?checkout=cancelled`,
    subscription_data: {
      metadata: { workspaceId: params.workspaceId, plan: params.plan },
    },
    metadata: { workspaceId: params.workspaceId, plan: params.plan },
  });

  if (!session.url) {
    throw new BillingError("Stripe did not return a checkout URL.");
  }

  return { url: session.url };
}

async function releaseSubscriptionScheduleIfPresent(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<boolean> {
  const scheduleId = getSubscriptionScheduleId(subscription);
  if (!scheduleId) {
    return false;
  }

  await stripe.subscriptionSchedules.release(scheduleId);
  return true;
}

function getScheduledTargetPlan(schedule: Stripe.SubscriptionSchedule): SubscriptionPlan | null {
  const phases = schedule.phases ?? [];
  if (phases.length < 2) {
    return null;
  }

  const lastPhase = phases[phases.length - 1];
  const price = lastPhase?.items[0]?.price;
  const priceId =
    typeof price === "string" ? price : (price && "id" in price ? price.id : null);
  return planFromPriceId(priceId ?? null);
}

async function scheduleDowngradeAtPeriodEnd(params: {
  workspaceId: string;
  stripeSubscriptionId: string;
  currentPlan: SubscriptionPlan;
  targetPlan: SubscriptionPlan;
}): Promise<{ effectiveAt: Date }> {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(params.stripeSubscriptionId, {
    expand: ["schedule"],
  });

  const item = subscription.items.data[0];
  if (!item) {
    throw new BillingError("Stripe subscription has no line items.");
  }

  const currentPriceId = extractStripePriceId(item);
  const currentPeriodEnd = item.current_period_end;
  if (!currentPriceId || !currentPeriodEnd) {
    throw new BillingError("Stripe subscription is missing billing period data.");
  }

  const targetPriceId = priceIdForPlan(params.targetPlan);
  let scheduleId = getSubscriptionScheduleId(subscription);

  if (!scheduleId) {
    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: params.stripeSubscriptionId,
    });
    scheduleId = schedule.id;
  }

  await stripe.subscriptionSchedules.update(scheduleId, {
    end_behavior: "release",
    phases: [
      {
        items: [{ price: currentPriceId, quantity: 1 }],
        start_date: item.current_period_start,
        end_date: currentPeriodEnd,
        metadata: {
          workspaceId: params.workspaceId,
          plan: params.currentPlan,
        },
      },
      {
        items: [{ price: targetPriceId, quantity: 1 }],
        start_date: currentPeriodEnd,
        metadata: {
          workspaceId: params.workspaceId,
          plan: params.targetPlan,
        },
      },
    ],
  });

  await stripe.subscriptions.update(params.stripeSubscriptionId, {
    metadata: {
      workspaceId: params.workspaceId,
      plan: params.currentPlan,
      pendingPlan: params.targetPlan,
    },
  });

  return { effectiveAt: new Date(currentPeriodEnd * 1000) };
}

async function upgradeSubscriptionImmediately(params: {
  workspaceId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  targetPlan: SubscriptionPlan;
}): Promise<SubscriptionPlan> {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(params.stripeSubscriptionId, {
    expand: ["schedule"],
  });

  await releaseSubscriptionScheduleIfPresent(stripe, subscription);

  const item = subscription.items.data[0];
  if (!item) {
    throw new BillingError("Stripe subscription has no line items.");
  }

  const updated = await stripe.subscriptions.update(params.stripeSubscriptionId, {
    items: [{ id: item.id, price: priceIdForPlan(params.targetPlan) }],
    proration_behavior: "create_prorations",
    metadata: {
      workspaceId: params.workspaceId,
      plan: params.targetPlan,
      pendingPlan: "",
    },
    cancel_at_period_end: false,
  });

  await enforceSingleActiveSubscription({
    workspaceId: params.workspaceId,
    keepSubscriptionId: updated.id,
    stripeCustomerId: params.stripeCustomerId,
  });

  await syncSubscriptionFromStripe(updated, params.stripeCustomerId, {
    planHint: params.targetPlan,
  });

  return params.targetPlan;
}

/**
 * Single entrypoint for all workspace plan changes (FREE/PRO/BUSINESS).
 * Enforces: one workspace = one active Stripe subscription.
 */
export async function changeWorkspaceSubscriptionPlan(params: {
  workspaceId: string;
  plan: SubscriptionPlan;
}): Promise<WorkspacePlanChangeResult> {
  if (params.plan === "FREE") {
    throw new WorkspaceError("Downgrading to FREE is not supported through plan change.");
  }

  const { resolveBillingCustomer } = await import(
    "@/features/billing/server/billing-service"
  );

  const subscription = await loadWorkspaceSubscription(params.workspaceId);
  const targetPlan = params.plan;

  if (subscription.plan === targetPlan && !subscription.stripeSubscriptionId) {
    const { stripeCustomerId } = await resolveBillingCustomer(params.workspaceId);
    const checkout = await createCheckoutSession({
      workspaceId: params.workspaceId,
      slug: subscription.slug,
      plan: targetPlan,
      stripeCustomerId,
    });
    return { kind: "checkout", url: checkout.url };
  }

  if (!isActivePaidSubscription(subscription)) {
    const { stripeCustomerId } = await resolveBillingCustomer(params.workspaceId);
    const checkout = await createCheckoutSession({
      workspaceId: params.workspaceId,
      slug: subscription.slug,
      plan: targetPlan,
      stripeCustomerId,
    });
    return { kind: "checkout", url: checkout.url };
  }

  const stripe = getStripeClient();
  const { stripeCustomerId } = await resolveBillingCustomer(params.workspaceId);
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId!,
    { expand: ["schedule"] },
  );

  const scheduleId = getSubscriptionScheduleId(stripeSubscription);
  let scheduledTargetPlan: SubscriptionPlan | null = null;
  if (scheduleId) {
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    scheduledTargetPlan = getScheduledTargetPlan(schedule);
  }

  if (subscription.plan === targetPlan) {
    if (scheduledTargetPlan && scheduledTargetPlan !== subscription.plan) {
      if (targetPlan !== scheduledTargetPlan) {
        await releaseSubscriptionScheduleIfPresent(stripe, stripeSubscription);
        await stripe.subscriptions.update(subscription.stripeSubscriptionId!, {
          metadata: {
            workspaceId: params.workspaceId,
            plan: subscription.plan,
            pendingPlan: "",
          },
        });
        await syncSubscriptionFromStripe(
          await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId!),
          stripeCustomerId,
          { planHint: subscription.plan },
        );
        return { kind: "downgrade_canceled", plan: subscription.plan };
      }

      return { kind: "noop", plan: subscription.plan };
    }

    return { kind: "noop", plan: subscription.plan };
  }

  if (scheduledTargetPlan === targetPlan) {
    return { kind: "noop", plan: subscription.plan };
  }

  if (targetPlan === "BUSINESS" && subscription.plan === "PRO") {
    const plan = await upgradeSubscriptionImmediately({
      workspaceId: params.workspaceId,
      stripeSubscriptionId: subscription.stripeSubscriptionId!,
      stripeCustomerId,
      targetPlan,
    });
    return { kind: "updated", plan };
  }

  if (targetPlan === "PRO" && subscription.plan === "BUSINESS") {
    const { effectiveAt } = await scheduleDowngradeAtPeriodEnd({
      workspaceId: params.workspaceId,
      stripeSubscriptionId: subscription.stripeSubscriptionId!,
      currentPlan: subscription.plan,
      targetPlan,
    });

    return {
      kind: "downgrade_scheduled",
      currentPlan: subscription.plan,
      targetPlan,
      effectiveAt: effectiveAt.toISOString(),
    };
  }

  throw new BillingError(
    `Unsupported plan transition from ${subscription.plan} to ${targetPlan}.`,
  );
}
