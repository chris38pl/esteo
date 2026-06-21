import { prisma } from "@/db/client";
import { getStripeClient } from "@/features/billing/server/stripe-client";

type StripeCustomerSnapshot = { deleted?: boolean } | null;

/**
 * Picks the first Stripe customer ID that still exists in Stripe.
 * Input order matters: callers pass newest-first billing customer IDs.
 */
export async function selectValidReferrerStripeCustomerId(
  stripeCustomerIdsNewestFirst: string[],
  retrieve: (stripeCustomerId: string) => Promise<StripeCustomerSnapshot>,
): Promise<string | null> {
  for (const stripeCustomerId of stripeCustomerIdsNewestFirst) {
    try {
      const customer = await retrieve(stripeCustomerId);
      if (customer && !customer.deleted) {
        return stripeCustomerId;
      }
    } catch {
      // Stale or missing customer — try the next billing record.
    }
  }
  return null;
}

export async function listReferrerStripeCustomerIds(referrerUserId: string): Promise<string[]> {
  const rows = await prisma.billingCustomer.findMany({
    where: { ownerUserId: referrerUserId, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { stripeCustomerId: true },
  });

  return rows
    .map((row) => row.stripeCustomerId)
    .filter((id): id is string => Boolean(id));
}

export async function resolveReferrerStripeCustomerId(
  referrerUserId: string,
): Promise<string | null> {
  const candidateIds = await listReferrerStripeCustomerIds(referrerUserId);
  if (candidateIds.length === 0) {
    return null;
  }

  const stripe = getStripeClient();
  return selectValidReferrerStripeCustomerId(candidateIds, async (id) => {
    const customer = await stripe.customers.retrieve(id);
    if ("deleted" in customer && customer.deleted) {
      return { deleted: true };
    }
    return {};
  });
}

export async function findReferralBalanceTransactionId(
  stripeCustomerId: string,
  referralId: string,
): Promise<string | null> {
  const stripe = getStripeClient();
  const txns = await stripe.customers.listBalanceTransactions(stripeCustomerId, {
    limit: 100,
  });
  const match = txns.data.find((txn) => txn.metadata?.referralId === referralId);
  return match?.id ?? null;
}
