import "server-only";

import { prisma } from "@/db/client";
import { getStripeClient } from "@/features/billing/server/stripe-client";
import {
  findReferralBalanceTransactionId,
  resolveReferrerStripeCustomerId,
} from "@/features/referrals/lib/referral-billing-customer";

export async function getReferrerStripeBalanceCents(referrerUserId: string): Promise<number> {
  const stripeCustomerId = await resolveReferrerStripeCustomerId(referrerUserId);
  if (!stripeCustomerId) {
    return 0;
  }

  const stripe = getStripeClient();
  const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
  if (stripeCustomer.deleted) {
    return 0;
  }

  // Stripe balance: negative = credit available to the customer.
  const balance = stripeCustomer.balance ?? 0;
  return balance < 0 ? Math.abs(balance) : 0;
}

function formatGrantError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }
  return "Unknown Stripe error";
}

async function markReferralGranted(referralId: string, grantedAt: Date): Promise<void> {
  await prisma.referral.update({
    where: { id: referralId },
    data: {
      rewardStatus: "GRANTED",
      rewardGrantedAt: grantedAt,
      rewardFailureReason: null,
      rewardLastRetryAt: null,
    },
  });
}

async function markReferralFailed(referralId: string, reason: string): Promise<void> {
  await prisma.referral.update({
    where: { id: referralId },
    data: {
      rewardStatus: "FAILED",
      rewardGrantedAt: null,
      rewardFailureReason: reason,
      rewardLastRetryAt: new Date(),
    },
  });
}

async function createReferralBalanceTransaction(params: {
  stripeCustomerId: string;
  referralId: string;
  referrerUserId: string;
  invoiceId: string;
  amountCents: number;
}): Promise<string> {
  const stripe = getStripeClient();
  const txn = await stripe.customers.createBalanceTransaction(params.stripeCustomerId, {
    amount: -params.amountCents,
    currency: "pln",
    description: `Referral activation bonus (${params.referralId})`,
    metadata: {
      referralId: params.referralId,
      referrerUserId: params.referrerUserId,
      invoiceId: params.invoiceId,
    },
  });
  return txn.id;
}

export async function grantReferralBonus(params: {
  referrerUserId: string;
  referralId: string;
  amountCents: number;
  invoiceId: string;
}): Promise<{ ledgerId: string; stripeBalanceTxnId: string | null; granted: boolean }> {
  const existing = await prisma.referralCreditLedger.findUnique({
    where: {
      referralId_invoiceId: {
        referralId: params.referralId,
        invoiceId: params.invoiceId,
      },
    },
  });

  if (existing?.stripeBalanceTxnId) {
    await markReferralGranted(params.referralId, existing.createdAt);
    return {
      ledgerId: existing.id,
      stripeBalanceTxnId: existing.stripeBalanceTxnId,
      granted: true,
    };
  }

  let stripeBalanceTxnId: string | null = null;
  let failureReason: string | null = null;

  const stripeCustomerId = await resolveReferrerStripeCustomerId(params.referrerUserId);

  if (stripeCustomerId) {
    try {
      stripeBalanceTxnId = await findReferralBalanceTransactionId(
        stripeCustomerId,
        params.referralId,
      );

      if (!stripeBalanceTxnId) {
        stripeBalanceTxnId = await createReferralBalanceTransaction({
          stripeCustomerId,
          referralId: params.referralId,
          referrerUserId: params.referrerUserId,
          invoiceId: params.invoiceId,
          amountCents: params.amountCents,
        });
      }
    } catch (error) {
      failureReason = formatGrantError(error);
      console.error("Failed to grant Stripe referral balance:", error);
    }
  } else {
    failureReason = "Referrer has no valid Stripe customer for referral credits";
  }

  const ledger =
    existing ??
    (await prisma.referralCreditLedger.create({
      data: {
        referralId: params.referralId,
        referrerUserId: params.referrerUserId,
        amountCents: params.amountCents,
        rewardType: "ACTIVATION_BONUS",
        stripeBalanceTxnId,
        reason: "activation_bonus",
        invoiceId: params.invoiceId,
      },
    }));

  if (existing && stripeBalanceTxnId) {
    await prisma.referralCreditLedger.update({
      where: { id: existing.id },
      data: { stripeBalanceTxnId },
    });
  }

  if (stripeBalanceTxnId) {
    const grantedAt = new Date();
    await markReferralGranted(params.referralId, grantedAt);

    const { notifyReferralRewardGranted } = await import(
      "@/features/notifications/server/notification-emit-helpers"
    );
    const { resolveReferralRewardFailed } = await import(
      "@/features/notifications/server/resolve-notification"
    );
    const { fireNotification } = await import(
      "@/features/notifications/server/notification-workspace-context"
    );
    await resolveReferralRewardFailed(params.referralId);
    fireNotification(
      notifyReferralRewardGranted({
        locale: "pl",
        referrerUserId: params.referrerUserId,
        referralId: params.referralId,
      }),
    );

    return { ledgerId: ledger.id, stripeBalanceTxnId, granted: true };
  }

  await markReferralFailed(params.referralId, failureReason ?? "Stripe balance transaction failed");

  const { notifyReferralRewardFailed } = await import(
    "@/features/notifications/server/notification-emit-helpers"
  );
  const { fireNotification } = await import(
    "@/features/notifications/server/notification-workspace-context"
  );
  fireNotification(
    notifyReferralRewardFailed({
      locale: "pl",
      referrerUserId: params.referrerUserId,
      referralId: params.referralId,
    }),
  );

  return { ledgerId: ledger.id, stripeBalanceTxnId: null, granted: false };
}
