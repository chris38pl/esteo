/**
 * Audits referral KPI invariants for a referrer email.
 *
 *   npm run audit:referral-kpi -- --email chazychaz38@wp.pl
 */
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

import { computeReferralKpiFromRows, computeUsedReferralBalanceCents } from "../src/features/referrals/lib/referral-kpi-utils";

const prisma = new PrismaClient();

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(key);
}

function parseEmailArg(): string {
  const idx = process.argv.indexOf("--email");
  const email = idx >= 0 ? process.argv[idx + 1] : null;
  if (!email) {
    console.error("Usage: npm run audit:referral-kpi -- --email user@example.com");
    process.exit(1);
  }
  return email;
}

async function getReferrerStripeBalanceCents(stripeCustomerId: string | null): Promise<number> {
  if (!stripeCustomerId) {
    return 0;
  }
  const stripe = getStripeClient();
  const customer = await stripe.customers.retrieve(stripeCustomerId);
  if (customer.deleted) {
    return 0;
  }
  const balance = customer.balance ?? 0;
  return balance < 0 ? Math.abs(balance) : 0;
}

async function main() {
  const email = parseEmailArg();

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const billingCustomer = await prisma.billingCustomer.findFirst({
    where: { ownerUserId: user.id, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { stripeCustomerId: true },
  });

  const referrals = await prisma.referral.findMany({
    where: { referrerUserId: user.id },
    select: {
      id: true,
      status: true,
      rewardCents: true,
      rewardStatus: true,
      rewardGrantedAt: true,
      rewardFailureReason: true,
      referredWorkspace: { select: { slug: true, name: true } },
      creditLedger: {
        select: { id: true, amountCents: true, stripeBalanceTxnId: true, invoiceId: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const kpi = computeReferralKpiFromRows(referrals);
  const availableBalanceCents = await getReferrerStripeBalanceCents(
    billingCustomer?.stripeCustomerId ?? null,
  );
  const usedBalanceCents = computeUsedReferralBalanceCents(
    kpi.grantedRewardsCents,
    availableBalanceCents,
  );

  const activeRewardTotal = referrals
    .filter((r) => r.status === "ACTIVE" && r.rewardCents > 0)
    .reduce((sum, r) => sum + r.rewardCents, 0);

  console.log(`\nReferral KPI audit: ${user.email}`);
  console.log(`Stripe customer: ${billingCustomer?.stripeCustomerId ?? "none"}`);
  console.log("--- Hero KPI ---");
  console.log(`  referredCompaniesCount:   ${kpi.referredCompaniesCount}`);
  console.log(`  grantedRewardsCents:      ${kpi.grantedRewardsCents}`);
  console.log(`  availableBalanceCents:    ${availableBalanceCents}`);
  console.log(`  usedBalanceCents:         ${usedBalanceCents}`);
  console.log(`  processingBalanceCents:   ${kpi.processingBalanceCents} (support only)`);

  console.log("\n--- Referrals ---");
  for (const referral of referrals) {
    const ledger = referral.creditLedger
      .map((l) => `${l.amountCents}→${l.stripeBalanceTxnId ?? "null"}`)
      .join(", ");
    console.log(
      `  ${referral.referredWorkspace.slug}: status=${referral.status} rewardStatus=${referral.rewardStatus ?? "null"} rewardCents=${referral.rewardCents} ledger=[${ledger}]`,
    );
    if (referral.rewardFailureReason) {
      console.log(`    failure: ${referral.rewardFailureReason}`);
    }
  }

  console.log("\n--- Invariants ---");
  let failures = 0;

  const sumGrantedDb = referrals
    .filter((r) => r.rewardStatus === "GRANTED")
    .reduce((sum, r) => sum + r.rewardCents, 0);
  const sumProcessingDb = referrals
    .filter((r) => r.rewardStatus === "PENDING" || r.rewardStatus === "FAILED")
    .reduce((sum, r) => sum + r.rewardCents, 0);

  const checks: Array<[boolean, string]> = [
    [kpi.grantedRewardsCents === sumGrantedDb, "grantedRewardsCents = sum GRANTED rewardCents"],
    [kpi.processingBalanceCents === sumProcessingDb, "processingBalanceCents = sum PENDING+FAILED"],
    [
      kpi.grantedRewardsCents + kpi.processingBalanceCents === activeRewardTotal,
      "granted + processing = total ACTIVE rewardCents",
    ],
    [availableBalanceCents <= kpi.grantedRewardsCents, "availableBalanceCents ≤ grantedRewardsCents"],
    [
      usedBalanceCents === computeUsedReferralBalanceCents(kpi.grantedRewardsCents, availableBalanceCents),
      "usedBalanceCents = max(0, granted - available)",
    ],
  ];

  if (kpi.processingBalanceCents === 0) {
    checks.push([
      kpi.grantedRewardsCents === availableBalanceCents + usedBalanceCents,
      "granted = available + used when no processing",
    ]);
  }

  for (const referral of referrals) {
    if (referral.rewardStatus === "GRANTED" && !referral.rewardGrantedAt) {
      checks.push([false, `${referral.id}: GRANTED without rewardGrantedAt`]);
    }
    if (referral.rewardStatus === "GRANTED") {
      const hasCbtxn = referral.creditLedger.some((l) => l.stripeBalanceTxnId);
      checks.push([hasCbtxn, `${referral.referredWorkspace.slug}: GRANTED has cbtxn in ledger`]);
    }
    if (referral.rewardStatus === "PENDING" || referral.rewardStatus === "FAILED") {
      checks.push([
        referral.rewardGrantedAt == null,
        `${referral.referredWorkspace.slug}: PENDING/FAILED has no rewardGrantedAt`,
      ]);
    }
  }

  for (const [ok, message] of checks) {
    console.log(`  ${ok ? "✓" : "✗"} ${message}`);
    if (!ok) {
      failures += 1;
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} invariant(s) failed.`);
    process.exit(1);
  }

  console.log("\nAll invariants passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
