/**
 * Activates pending referrals whose referred workspace already has a paid subscription
 * but bonus was never granted (common on localhost without Stripe webhooks).
 *
 *   npm run prisma:backfill-referral-activations
 */
import { PrismaClient, type SubscriptionPlan } from "@prisma/client";
import Stripe from "stripe";

const REFERRAL_REWARD_CENTS: Record<string, number> = {
  PRO_2026: 3000,
  BUSINESS_2026: 8000,
};

const DEFAULT_PLAN_VERSION: Record<SubscriptionPlan, string> = {
  FREE: "FREE_2026",
  PRO: "PRO_2026",
  BUSINESS: "BUSINESS_2026",
};

const prisma = new PrismaClient();

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(key);
}

async function resolveReferrerStripeCustomerId(referrerUserId: string): Promise<string | null> {
  const customer = await prisma.billingCustomer.findFirst({
    where: { ownerUserId: referrerUserId, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { stripeCustomerId: true },
  });
  return customer?.stripeCustomerId ?? null;
}

async function resolveActivationInvoiceId(
  stripe: Stripe,
  stripeSubscriptionId: string,
): Promise<string> {
  try {
    const invoices = await stripe.invoices.list({
      subscription: stripeSubscriptionId,
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
    console.warn(`Failed to resolve invoice for ${stripeSubscriptionId}:`, error);
  }
  return `sync:${stripeSubscriptionId}`;
}

async function activateReferral(params: {
  referralId: string;
  referrerUserId: string;
  workspaceId: string;
  plan: SubscriptionPlan;
  planVersion: string;
  invoiceId: string;
  rewardCents: number;
}): Promise<void> {
  await prisma.referral.update({
    where: { id: params.referralId },
    data: {
      status: "ACTIVE",
      referredPlan: params.plan,
      referredPlanVersion: params.planVersion,
      rewardCents: params.rewardCents,
      rewardType: "ACTIVATION_BONUS",
      rewardGrantedAt: new Date(),
      activatedAt: new Date(),
    },
  });

  const existingLedger = await prisma.referralCreditLedger.findUnique({
    where: {
      referralId_invoiceId: {
        referralId: params.referralId,
        invoiceId: params.invoiceId,
      },
    },
  });
  if (existingLedger) {
    return;
  }

  let stripeBalanceTxnId: string | null = null;
  const stripeCustomerId = await resolveReferrerStripeCustomerId(params.referrerUserId);
  if (stripeCustomerId) {
    try {
      const stripe = getStripeClient();
      const txn = await stripe.customers.createBalanceTransaction(stripeCustomerId, {
        amount: -params.rewardCents,
        currency: "pln",
        description: `Referral activation bonus (${params.referralId})`,
        metadata: {
          referralId: params.referralId,
          referrerUserId: params.referrerUserId,
          invoiceId: params.invoiceId,
        },
      });
      stripeBalanceTxnId = txn.id;
    } catch (error) {
      console.error(`Failed to grant Stripe balance for referral ${params.referralId}:`, error);
    }
  }

  await prisma.referralCreditLedger.create({
    data: {
      referralId: params.referralId,
      referrerUserId: params.referrerUserId,
      amountCents: params.rewardCents,
      rewardType: "ACTIVATION_BONUS",
      stripeBalanceTxnId,
      reason: "Referral activation bonus (backfill)",
      invoiceId: params.invoiceId,
    },
  });
}

async function main() {
  const pendingReferrals = await prisma.referral.findMany({
    where: {
      status: "PENDING_CLAIM",
      rewardGrantedAt: null,
      fraudFlag: { not: "SUSPICIOUS" },
    },
    include: {
      referredWorkspace: {
        select: {
          id: true,
          slug: true,
          billingAccount: {
            select: {
              subscription: {
                select: {
                  plan: true,
                  planVersion: true,
                  status: true,
                  stripeSubscriptionId: true,
                },
              },
            },
          },
          owner: { select: { email: true } },
        },
      },
    },
  });

  const stripe = getStripeClient();
  let activated = 0;
  let skipped = 0;

  for (const referral of pendingReferrals) {
    const subscription = referral.referredWorkspace.billingAccount?.subscription;
    if (
      !subscription?.stripeSubscriptionId ||
      subscription.plan === "FREE" ||
      (subscription.status !== "ACTIVE" && subscription.status !== "TRIAL")
    ) {
      skipped += 1;
      continue;
    }

    const planVersion =
      subscription.planVersion && subscription.planVersion in REFERRAL_REWARD_CENTS
        ? subscription.planVersion
        : DEFAULT_PLAN_VERSION[subscription.plan];
    const rewardCents = REFERRAL_REWARD_CENTS[planVersion];
    if (rewardCents == null) {
      skipped += 1;
      continue;
    }

    const invoiceId = await resolveActivationInvoiceId(
      stripe,
      subscription.stripeSubscriptionId,
    );

    await activateReferral({
      referralId: referral.id,
      referrerUserId: referral.referrerUserId,
      workspaceId: referral.referredWorkspace.id,
      plan: subscription.plan,
      planVersion,
      invoiceId,
      rewardCents,
    });

    activated += 1;
    console.log(
      `  + ${referral.referredWorkspace.owner.email ?? referral.referredWorkspace.slug}: ${rewardCents} grosze`,
    );
  }

  console.log(
    `Backfill complete: ${activated} referral(s) activated, ${skipped} skipped, ${pendingReferrals.length} pending scanned.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
