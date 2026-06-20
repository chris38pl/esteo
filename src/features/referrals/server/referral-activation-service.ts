import "server-only";

import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/db/client";
import { getStripeClient } from "@/features/billing/server/stripe-client";
import {
  extractStripePriceId,
  findBasePlanSubscriptionItem,
  planFromPriceId,
  resolvePlanFromStripeSubscription,
} from "@/features/billing/server/stripe-plan-utils";
import { defaultPlanVersion } from "@/server/billing/plan-catalog";
import { resolvePartnerTier } from "@/features/referrals/lib/referral-partner-tier";
import { grantReferralBonus } from "@/features/referrals/server/referral-credit-service";
import { countActiveReferralsForReferrer } from "@/features/referrals/server/referral-fraud-detector";
import { countOwnedWorkspaces } from "@/features/referrals/server/referral-eligibility";
import {
  monthlyRevenueForWorkspace,
  syncReferralMonthlyRevenue,
} from "@/features/referrals/server/referral-mrr-sync";
import {
  rewardForPlanVersion,
  rewardForPriceId,
  isRewardEligiblePlanVersion,
} from "@/features/referrals/server/referral-rewards-catalog";

function resolvePlanVersionFromStripeSubscription(
  subscription: Stripe.Subscription,
  plan: SubscriptionPlan,
): string {
  const baseItem = findBasePlanSubscriptionItem(subscription);
  const priceId = extractStripePriceId(baseItem);
  let planVersion = defaultPlanVersion(plan);

  if (priceId) {
    try {
      rewardForPriceId(priceId);
      const mappedPlan = planFromPriceId(priceId);
      if (mappedPlan && mappedPlan !== "FREE") {
        planVersion = defaultPlanVersion(mappedPlan);
      }
    } catch {
      // fall back to default plan version
    }
  }

  const subPlanVersion = subscription.metadata?.planVersion;
  if (subPlanVersion && isRewardEligiblePlanVersion(subPlanVersion)) {
    planVersion = subPlanVersion;
  }

  return planVersion;
}

function planVersionFromInvoice(
  invoice: Stripe.Invoice,
  subscription: Stripe.Subscription,
): { plan: SubscriptionPlan; planVersion: string } {
  const plan = resolvePlanFromStripeSubscription(subscription, {
    planHint: subscription.metadata?.plan ?? null,
  });

  return {
    plan,
    planVersion: resolvePlanVersionFromStripeSubscription(subscription, plan),
  };
}

async function resolveActivationInvoiceId(
  stripeSubscription: Stripe.Subscription,
): Promise<string> {
  try {
    const stripe = getStripeClient();
    const invoices = await stripe.invoices.list({
      subscription: stripeSubscription.id,
      status: "paid",
      limit: 10,
    });
    const createInvoice = invoices.data.find(
      (invoice) => invoice.billing_reason === "subscription_create",
    );
    if (createInvoice?.id) {
      return createInvoice.id;
    }
  } catch (error) {
    console.warn(
      `Failed to resolve activation invoice for subscription ${stripeSubscription.id}:`,
      error,
    );
  }

  return `sync:${stripeSubscription.id}`;
}

export async function activateReferralForPaidWorkspace(params: {
  workspaceId: string;
  plan: SubscriptionPlan;
  planVersion: string;
  invoiceId: string;
}): Promise<void> {
  const referral = await prisma.referral.findUnique({
    where: { referredWorkspaceId: params.workspaceId },
  });

  if (!referral) {
    return;
  }

  if (referral.fraudFlag === "SUSPICIOUS") {
    return;
  }

  if (referral.rewardGrantedAt) {
    await syncReferralMonthlyRevenue(params.workspaceId);
    return;
  }

  if (params.plan === "FREE") {
    return;
  }

  let rewardCents: number;
  try {
    rewardCents = rewardForPlanVersion(params.planVersion);
  } catch {
    console.warn(`No referral reward for planVersion ${params.planVersion}`);
    return;
  }

  const activeCount = await countActiveReferralsForReferrer(referral.referrerUserId);
  const tier = resolvePartnerTier(activeCount);
  const workspaceCount = await countOwnedWorkspaces(referral.referrerUserId);
  const mrrCents = await monthlyRevenueForWorkspace(params.workspaceId);

  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      status: "ACTIVE",
      referredPlan: params.plan,
      referredPlanVersion: params.planVersion,
      rewardCents,
      rewardType: "ACTIVATION_BONUS",
      rewardGrantedAt: new Date(),
      activatedAt: new Date(),
      monthlyRevenueCents: mrrCents,
      referrerTierAtActivation: tier,
      referrerWorkspaceCountAtActivation: workspaceCount,
    },
  });

  await grantReferralBonus({
    referrerUserId: referral.referrerUserId,
    referralId: referral.id,
    amountCents: rewardCents,
    invoiceId: params.invoiceId,
  });
}

export async function handleReferralActivationFromInvoice(params: {
  invoice: Stripe.Invoice;
  subscription: Stripe.Subscription;
  workspaceId: string;
}): Promise<void> {
  const referral = await prisma.referral.findUnique({
    where: { referredWorkspaceId: params.workspaceId },
    select: { id: true, rewardGrantedAt: true },
  });

  if (!referral) {
    return;
  }

  if (referral.rewardGrantedAt) {
    await syncReferralMonthlyRevenue(params.workspaceId);
    return;
  }

  if (params.invoice.billing_reason !== "subscription_create") {
    await syncReferralMonthlyRevenue(params.workspaceId);
    return;
  }

  const { plan, planVersion } = planVersionFromInvoice(params.invoice, params.subscription);
  await activateReferralForPaidWorkspace({
    workspaceId: params.workspaceId,
    plan,
    planVersion,
    invoiceId: params.invoice.id,
  });
}

export async function tryActivateReferralFromSubscriptionSync(params: {
  workspaceId: string;
  stripeSubscription: Stripe.Subscription;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
}): Promise<void> {
  if (
    params.plan === "FREE" ||
    (params.status !== "ACTIVE" && params.status !== "TRIAL")
  ) {
    return;
  }

  const referral = await prisma.referral.findUnique({
    where: { referredWorkspaceId: params.workspaceId },
    select: { rewardGrantedAt: true },
  });

  if (!referral || referral.rewardGrantedAt) {
    return;
  }

  const planVersion = resolvePlanVersionFromStripeSubscription(
    params.stripeSubscription,
    params.plan,
  );
  const invoiceId = await resolveActivationInvoiceId(params.stripeSubscription);

  await activateReferralForPaidWorkspace({
    workspaceId: params.workspaceId,
    plan: params.plan,
    planVersion,
    invoiceId,
  });
}

export async function handleReferralSubscriptionUpdated(workspaceId: string): Promise<void> {
  const referral = await prisma.referral.findUnique({
    where: { referredWorkspaceId: workspaceId },
    select: { id: true, status: true },
  });
  if (!referral) {
    return;
  }

  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      billingAccount: {
        select: {
          subscription: {
            select: { plan: true, status: true, stripeSubscriptionId: true },
          },
        },
      },
    },
  });

  const sub = ws?.billingAccount?.subscription;
  const isPaidActive =
    sub &&
    sub.plan !== "FREE" &&
    sub.stripeSubscriptionId &&
    (sub.status === "ACTIVE" || sub.status === "TRIAL");

  if (!isPaidActive && referral.status === "ACTIVE") {
    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: "INACTIVE", monthlyRevenueCents: 0 },
    });
    return;
  }

  await syncReferralMonthlyRevenue(workspaceId);
}

export async function resolveWorkspaceIdFromStripeSubscription(
  subscription: Stripe.Subscription,
): Promise<string | null> {
  if (subscription.metadata?.workspaceId) {
    return subscription.metadata.workspaceId;
  }

  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!stripeCustomerId) {
    return null;
  }

  const billingAccount = await prisma.billingAccount.findFirst({
    where: {
      billingCustomer: { is: { stripeCustomerId } },
      workspaceId: { not: null },
    },
    select: { workspaceId: true },
    orderBy: { createdAt: "desc" },
  });

  return billingAccount?.workspaceId ?? null;
}
