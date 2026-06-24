/**
 * Staging smoke check for referral email lookup after backfill.
 * Run: npm run prisma:backfill-referral-profiles:staging
 * Then: npx tsx scripts/verify-referral-staging-lookup.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PARTNER_EMAIL = "juniorkrawiec@gmail.com";
const FREE_USER_EMAIL = "juniorkrawiec@wp.pl";

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
    select: {
      id: true,
      referralProfile: { select: { code: true } },
    },
  });
  if (!freeUser) {
    console.error(`✗ ${FREE_USER_EMAIL} user not found on staging`);
    failures += 1;
  } else if (!freeUser.referralProfile) {
    console.log(
      `✓ ${FREE_USER_EMAIL} exists without profile yet (lazy-create on /referrals or backfill)`,
    );
  } else {
    console.log(
      `✓ ${FREE_USER_EMAIL} can refer with code ${freeUser.referralProfile.code}`,
    );
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
