/**
 * Backfills UserReferralProfile for all workspace owners.
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

const prisma = new PrismaClientCtor();

async function main() {
  const owners = await prisma.workspace.findMany({
    where: { deletedAt: null },
    select: {
      ownerId: true,
      owner: { select: { email: true } },
    },
    distinct: ["ownerId"],
  });

  let created = 0;
  let skipped = 0;

  for (const row of owners) {
    const before = await prisma.userReferralProfile.findUnique({
      where: { userId: row.ownerId },
      select: { code: true },
    });

    const after = await getOrCreateUserReferralProfile(prisma, row.ownerId);

    if (!before) {
      created += 1;
      console.log(`  + ${row.owner.email ?? row.ownerId} → ${after.code}`);
    } else {
      skipped += 1;
    }
  }

  console.log(
    `Backfill complete: ${created} profile(s) created, ${skipped} already existed, ${owners.length} owner(s) scanned.`,
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
