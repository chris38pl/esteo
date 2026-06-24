import { prisma } from "@/db/client";
import { getStripeClient } from "@/features/billing/server/stripe-client";
import { isUniqueConstraintError } from "@/lib/database/is-unique-constraint-error";

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

async function deleteOrphanStripeCustomer(stripeCustomerId: string): Promise<void> {
  try {
    const stripe = getStripeClient();
    await stripe.customers.del(stripeCustomerId);
  } catch {
    // Best-effort cleanup after a lost create race.
  }
}

/**
 * Returns a valid Stripe customer for referral credits, creating BillingCustomer
 * lazily when the referrer has never checked out. Idempotent and race-safe when
 * BillingCustomer.ownerUserId is unique.
 */
export async function ensureReferrerStripeCustomerId(
  referrerUserId: string,
): Promise<string | null> {
  const existing = await resolveReferrerStripeCustomerId(referrerUserId);
  if (existing) {
    return existing;
  }

  const user = await prisma.user.findUnique({
    where: { id: referrerUserId },
    select: { email: true, name: true },
  });
  if (!user) {
    return null;
  }

  const stripe = getStripeClient();
  const stripeCustomer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { ownerUserId: referrerUserId },
  });

  try {
    await prisma.billingCustomer.create({
      data: {
        ownerUserId: referrerUserId,
        stripeCustomerId: stripeCustomer.id,
      },
    });
    return stripeCustomer.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const winner = await prisma.billingCustomer.findFirst({
        where: { ownerUserId: referrerUserId, stripeCustomerId: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { stripeCustomerId: true },
      });
      if (winner?.stripeCustomerId) {
        await deleteOrphanStripeCustomer(stripeCustomer.id);
        return winner.stripeCustomerId;
      }
      return resolveReferrerStripeCustomerId(referrerUserId);
    }
    throw error;
  }
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
