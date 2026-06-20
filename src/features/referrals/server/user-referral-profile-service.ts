import "server-only";

import { prisma } from "@/db/client";
import { canUserGenerateReferrals } from "@/features/referrals/server/referral-eligibility";
import { isUniqueConstraintError } from "@/lib/database/is-unique-constraint-error";

const CODE_MIN_LENGTH = 4;
const CODE_MAX_LENGTH = 20;
const CODE_PATTERN = /^[A-Z0-9]+$/;

function normalizeReferralCodeInput(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

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

async function isCodeAvailable(code: string): Promise<boolean> {
  const existing = await prisma.userReferralProfile.findUnique({
    where: { code },
    select: { id: true },
  });
  return !existing;
}

async function generateUniqueCode(base: string): Promise<string> {
  const normalized = normalizeReferralCodeInput(base);
  const seed = normalized.length >= CODE_MIN_LENGTH ? normalized.slice(0, CODE_MAX_LENGTH) : "PARTNER";

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const suffix = attempt === 0 ? "" : String(attempt + 1);
    const candidate = `${seed.slice(0, CODE_MAX_LENGTH - suffix.length)}${suffix}`;
    if (candidate.length < CODE_MIN_LENGTH) {
      continue;
    }
    if (await isCodeAvailable(candidate)) {
      return candidate;
    }
  }

  const fallback = `P${Date.now().toString(36).toUpperCase().slice(-8)}`;
  return fallback.slice(0, CODE_MAX_LENGTH);
}

export async function getOrCreateUserReferralProfile(userId: string) {
  const existing = await prisma.userReferralProfile.findUnique({
    where: { userId },
    include: { user: { select: { email: true, name: true } } },
  });
  if (existing) {
    return existing;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (!user) {
    throw new Error("User not found.");
  }

  const base = slugifyNameForCode(user.name) || slugifyNameForCode(user.email.split("@")[0]);
  const code = await generateUniqueCode(base || "ESTEO");

  try {
    return await prisma.userReferralProfile.create({
      data: { userId, code },
      include: { user: { select: { email: true, name: true } } },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const raced = await prisma.userReferralProfile.findUnique({
        where: { userId },
        include: { user: { select: { email: true, name: true } } },
      });
      if (raced) {
        return raced;
      }
    }
    throw error;
  }
}

export async function resolveReferrerByCode(code: string) {
  const normalized = normalizeReferralCodeInput(code);
  if (!normalized || !CODE_PATTERN.test(normalized)) {
    return null;
  }

  return prisma.userReferralProfile.findUnique({
    where: { code: normalized },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
}

export async function ensureReferralProfileForEligiblePartner(userId: string): Promise<void> {
  if (!(await canUserGenerateReferrals(userId))) {
    return;
  }
  await getOrCreateUserReferralProfile(userId);
}

export async function resolveReferrerByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    return null;
  }

  let profile = await prisma.userReferralProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    if (!(await canUserGenerateReferrals(user.id))) {
      return null;
    }
    profile = await getOrCreateUserReferralProfile(user.id);
  }

  return { profile, user };
}

export function isValidReferralCodeFormat(code: string): boolean {
  const normalized = normalizeReferralCodeInput(code);
  return (
    normalized.length >= CODE_MIN_LENGTH &&
    normalized.length <= CODE_MAX_LENGTH &&
    CODE_PATTERN.test(normalized)
  );
}

export { normalizeReferralCodeInput };
