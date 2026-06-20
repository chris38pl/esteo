/**
 * Backfills UserReferralProfile for owners with ACTIVE PRO/BUSINESS subscriptions.
 *
 *   npm run prisma:backfill-referral-profiles
 *   npm run prisma:backfill-referral-profiles:staging
 */
import type { PrismaClient } from "@prisma/client";
import { PrismaClient as PrismaClientCtor } from "@prisma/client";

const CODE_MIN_LENGTH = 4;
const CODE_MAX_LENGTH = 20;

function slugifyNameForCode(name: string | null | undefined): string {
  if (!name?.trim()) {
    return "";
  }
  return name
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CODE_MAX_LENGTH);
}

async function isCodeAvailable(prisma: PrismaClient, code: string): Promise<boolean> {
  const existing = await prisma.userReferralProfile.findUnique({
    where: { code },
    select: { id: true },
  });
  return !existing;
}

async function generateUniqueCode(prisma: PrismaClient, base: string): Promise<string> {
  const normalized = base
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const seed =
    normalized.length >= CODE_MIN_LENGTH ? normalized.slice(0, CODE_MAX_LENGTH) : "PARTNER";

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const suffix = attempt === 0 ? "" : String(attempt + 1);
    const candidate = `${seed.slice(0, CODE_MAX_LENGTH - suffix.length)}${suffix}`;
    if (candidate.length < CODE_MIN_LENGTH) {
      continue;
    }
    if (await isCodeAvailable(prisma, candidate)) {
      return candidate;
    }
  }

  return `P${Date.now().toString(36).toUpperCase().slice(-8)}`.slice(0, CODE_MAX_LENGTH);
}

async function getOrCreateUserReferralProfile(prisma: PrismaClient, userId: string) {
  const existing = await prisma.userReferralProfile.findUnique({ where: { userId } });
  if (existing) {
    return existing;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const base = slugifyNameForCode(user.name) || slugifyNameForCode(user.email.split("@")[0]);
  const code = await generateUniqueCode(prisma, base || "ESTEO");

  return prisma.userReferralProfile.create({
    data: { userId, code },
  });
}

async function canUserGenerateReferrals(prisma: PrismaClient, userId: string): Promise<boolean> {
  const owned = await prisma.workspace.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: {
      billingAccount: {
        select: {
          subscription: {
            select: {
              plan: true,
              status: true,
              stripeSubscriptionId: true,
            },
          },
        },
      },
    },
  });

  return owned.some((ws) => {
    const sub = ws.billingAccount?.subscription;
    if (!sub) {
      return false;
    }
    return (
      (sub.plan === "PRO" || sub.plan === "BUSINESS") &&
      (sub.status === "ACTIVE" || sub.status === "TRIAL") &&
      Boolean(sub.stripeSubscriptionId)
    );
  });
}

const prisma = new PrismaClientCtor();

async function main() {
  const accounts = await prisma.billingAccount.findMany({
    where: {
      subscription: {
        plan: { in: ["PRO", "BUSINESS"] },
        status: { in: ["ACTIVE", "TRIAL"] },
        stripeSubscriptionId: { not: null },
      },
    },
    select: {
      ownerUserId: true,
      owner: { select: { email: true } },
    },
  });

  const seen = new Set<string>();
  let created = 0;
  let skipped = 0;

  for (const account of accounts) {
    if (seen.has(account.ownerUserId)) {
      continue;
    }
    seen.add(account.ownerUserId);

    if (!(await canUserGenerateReferrals(prisma, account.ownerUserId))) {
      continue;
    }

    const before = await prisma.userReferralProfile.findUnique({
      where: { userId: account.ownerUserId },
      select: { code: true },
    });

    const after = await getOrCreateUserReferralProfile(prisma, account.ownerUserId);

    if (!before) {
      created += 1;
      console.log(`  + ${account.owner.email ?? account.ownerUserId} → ${after.code}`);
    } else {
      skipped += 1;
    }
  }

  console.log(
    `Backfill complete: ${created} profile(s) created, ${skipped} already existed, ${seen.size} eligible owner(s) scanned.`,
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
