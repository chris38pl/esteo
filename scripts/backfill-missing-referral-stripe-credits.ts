/**
 * Grants missing Stripe customer balance credits for referral ledger rows
 * that were recorded without a stripeBalanceTxnId.
 *
 *   npm run prisma:backfill-missing-referral-credits
 *   npm run prisma:backfill-missing-referral-credits -- --dry-run
 */
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

import {
  findReferralBalanceTransactionId,
  resolveReferrerStripeCustomerId,
} from "../src/features/referrals/lib/referral-billing-customer";

const prisma = new PrismaClient();

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(key);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const stripe = getStripeClient();

  const pendingLedgers = await prisma.referralCreditLedger.findMany({
    where: {
      amountCents: { gt: 0 },
      stripeBalanceTxnId: null,
    },
    include: {
      referral: {
        select: {
          id: true,
          rewardCents: true,
          rewardStatus: true,
          referredWorkspace: { select: { slug: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (pendingLedgers.length === 0) {
    console.log("No ledger rows missing Stripe balance transactions.");
    return;
  }

  let granted = 0;
  let skipped = 0;
  let failed = 0;

  for (const ledger of pendingLedgers) {
    const label = `${ledger.referral.referredWorkspace.slug} (${ledger.referralId})`;
    const stripeCustomerId = await resolveReferrerStripeCustomerId(ledger.referrerUserId);

    if (!stripeCustomerId) {
      console.warn(`  skip ${label}: referrer has no valid Stripe customer`);
      skipped += 1;
      continue;
    }

    let stripeBalanceTxnId = await findReferralBalanceTransactionId(
      stripeCustomerId,
      ledger.referralId,
    );

    if (!stripeBalanceTxnId) {
      if (dryRun) {
        console.log(`  dry-run would grant ${ledger.amountCents} grosze for ${label}`);
        granted += 1;
        continue;
      }

      try {
        const txn = await stripe.customers.createBalanceTransaction(stripeCustomerId, {
          amount: -ledger.amountCents,
          currency: "pln",
          description: `Referral activation bonus (${ledger.referralId})`,
          metadata: {
            referralId: ledger.referralId,
            referrerUserId: ledger.referrerUserId,
            invoiceId: ledger.invoiceId ?? "",
          },
        });
        stripeBalanceTxnId = txn.id;
      } catch (error) {
        console.error(`  failed ${label}:`, error);
        await prisma.referral.update({
          where: { id: ledger.referralId },
          data: {
            rewardStatus: "FAILED",
            rewardGrantedAt: null,
            rewardFailureReason:
              error instanceof Error ? error.message.slice(0, 500) : "Stripe backfill failed",
            rewardLastRetryAt: new Date(),
          },
        });
        failed += 1;
        continue;
      }
    }

    if (dryRun) {
      console.log(`  dry-run would link existing cbtxn ${stripeBalanceTxnId} for ${label}`);
      granted += 1;
      continue;
    }

    const grantedAt = new Date();
    await prisma.$transaction([
      prisma.referralCreditLedger.update({
        where: { id: ledger.id },
        data: { stripeBalanceTxnId },
      }),
      prisma.referral.update({
        where: { id: ledger.referralId },
        data: {
          rewardStatus: "GRANTED",
          rewardGrantedAt: grantedAt,
          rewardFailureReason: null,
          rewardLastRetryAt: null,
        },
      }),
    ]);

    granted += 1;
    console.log(`  + ${label}: ${ledger.amountCents} grosze → ${stripeBalanceTxnId}`);
  }

  console.log(
    `Backfill complete: ${granted} granted, ${skipped} skipped, ${failed} failed, ${pendingLedgers.length} scanned${dryRun ? " (dry-run)" : ""}.`,
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
