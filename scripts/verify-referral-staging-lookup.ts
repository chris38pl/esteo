/**
 * Staging smoke check for referral email lookup after backfill.
 * Run: node scripts/backfill-referral-profiles.mjs --staging (sets DATABASE_URL)
 * Then: npx tsx scripts/verify-referral-staging-lookup.ts
 *
 * Or with env already pointing at staging:
 *   npx tsx scripts/verify-referral-staging-lookup.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PARTNER_EMAIL = "juniorkrawiec@gmail.com";
const FREE_USER_EMAIL = "juniorkrawiec@wp.pl";

async function canUserGenerateReferrals(userId: string): Promise<boolean> {
  const owned = await prisma.workspace.findMany({
    where: { ownerId: userId, deletedAt: null },
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
  return owned.some((ws) => {
    const sub = ws.billingAccount?.subscription;
    return (
      sub &&
      (sub.plan === "PRO" || sub.plan === "BUSINESS") &&
      (sub.status === "ACTIVE" || sub.status === "TRIAL") &&
      Boolean(sub.stripeSubscriptionId)
    );
  });
}

async function main() {
  let failures = 0;

  const partner = await prisma.user.findUnique({
    where: { email: PARTNER_EMAIL },
    select: {
      id: true,
      referralProfile: { select: { code: true } },
    },
  });
  if (!partner?.referralProfile) {
    console.error(`✗ ${PARTNER_EMAIL} should have UserReferralProfile after backfill`);
    failures += 1;
  } else {
    console.log(`✓ Partner ${PARTNER_EMAIL} → code ${partner.referralProfile.code}`);
  }

  const freeUser = await prisma.user.findUnique({
    where: { email: FREE_USER_EMAIL },
    select: { id: true },
  });
  if (!freeUser) {
    console.error(`✗ ${FREE_USER_EMAIL} user not found on staging`);
    failures += 1;
  } else if (await canUserGenerateReferrals(freeUser.id)) {
    console.error(`✗ ${FREE_USER_EMAIL} should be FREE-only (PARTNER_NOT_ELIGIBLE)`);
    failures += 1;
  } else {
    console.log(`✓ ${FREE_USER_EMAIL} exists but is not referral-eligible (PARTNER_NOT_ELIGIBLE)`);
  }

  if (failures > 0) {
    process.exit(1);
  }
  console.log("\nStaging referral lookup preconditions OK.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
