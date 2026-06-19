import "server-only";

import { prisma } from "@/db/client";
import { getStripeClient } from "@/features/billing/server/stripe-client";
import { resolveBillingCustomer } from "@/features/billing/server/billing-service";

export async function getReferrerStripeBalanceCents(referrerUserId: string): Promise<number> {
  const customer = await prisma.billingCustomer.findFirst({
    where: { ownerUserId: referrerUserId, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { stripeCustomerId: true },
  });

  if (!customer?.stripeCustomerId) {
    return 0;
  }

  const stripe = getStripeClient();
  const stripeCustomer = await stripe.customers.retrieve(customer.stripeCustomerId);
  if (stripeCustomer.deleted) {
    return 0;
  }

  // Stripe balance: negative = credit available to the customer.
  const balance = stripeCustomer.balance ?? 0;
  return balance < 0 ? Math.abs(balance) : 0;
}

export async function grantReferralBonus(params: {
  referrerUserId: string;
  referralId: string;
  amountCents: number;
  invoiceId: string;
}): Promise<{ ledgerId: string; stripeBalanceTxnId: string | null }> {
  const existing = await prisma.referralCreditLedger.findUnique({
    where: {
      referralId_invoiceId: {
        referralId: params.referralId,
        invoiceId: params.invoiceId,
      },
    },
  });
  if (existing) {
    return { ledgerId: existing.id, stripeBalanceTxnId: existing.stripeBalanceTxnId };
  }

  const ownedWorkspace = await prisma.workspace.findFirst({
    where: { ownerId: params.referrerUserId, deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  let stripeBalanceTxnId: string | null = null;

  if (ownedWorkspace) {
    try {
      const { stripeCustomerId } = await resolveBillingCustomer(ownedWorkspace.id);
      const stripe = getStripeClient();
      const txn = await stripe.customers.createBalanceTransaction(stripeCustomerId, {
        amount: -params.amountCents,
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
      console.error("Failed to grant Stripe referral balance:", error);
    }
  }

  const ledger = await prisma.referralCreditLedger.create({
    data: {
      referralId: params.referralId,
      referrerUserId: params.referrerUserId,
      amountCents: params.amountCents,
      rewardType: "ACTIVATION_BONUS",
      stripeBalanceTxnId,
      reason: "activation_bonus",
      invoiceId: params.invoiceId,
    },
  });

  return { ledgerId: ledger.id, stripeBalanceTxnId };
}
