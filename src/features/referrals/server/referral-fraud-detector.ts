import type { ReferralAttributionSource } from "@prisma/client";

import { prisma } from "@/db/client";

export type ReferralFraudInput = {
  referrerUserId: string;
  referredOwnerId: string;
  referrerEmail: string;
  referredEmail: string;
  claimIpAddress?: string | null;
};

export type ReferralFraudResult = {
  fraudFlag: "NONE" | "SUSPICIOUS";
  fraudReason: string | null;
  referrerEmailDomain: string | null;
  referredEmailDomain: string | null;
};

function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0) {
    return null;
  }
  return email.slice(at + 1).toLowerCase();
}

export function detectReferralFraud(input: ReferralFraudInput): ReferralFraudResult {
  const referrerEmailDomain = emailDomain(input.referrerEmail);
  const referredEmailDomain = emailDomain(input.referredEmail);

  if (input.referrerUserId === input.referredOwnerId) {
    return {
      fraudFlag: "SUSPICIOUS",
      fraudReason: "self_referral",
      referrerEmailDomain,
      referredEmailDomain,
    };
  }

  if (
    referrerEmailDomain &&
    referredEmailDomain &&
    referrerEmailDomain === referredEmailDomain
  ) {
    return {
      fraudFlag: "SUSPICIOUS",
      fraudReason: "same_email_domain",
      referrerEmailDomain,
      referredEmailDomain,
    };
  }

  return {
    fraudFlag: "NONE",
    fraudReason: null,
    referrerEmailDomain,
    referredEmailDomain,
  };
}

export async function countActiveReferralsForReferrer(referrerUserId: string): Promise<number> {
  return prisma.referral.count({
    where: { referrerUserId, status: "ACTIVE" },
  });
}

export type AttributionCandidate = {
  source: ReferralAttributionSource;
  referrerUserId: string;
  codeUsed?: string | null;
  referrerEmailUsed?: string | null;
};

export function pickAttributionCandidate(
  candidates: AttributionCandidate[],
): AttributionCandidate | null {
  const priority: ReferralAttributionSource[] = ["LINK", "EMAIL", "CODE"];
  for (const source of priority) {
    const match = candidates.find((c) => c.source === source);
    if (match) {
      return match;
    }
  }
  return null;
}
