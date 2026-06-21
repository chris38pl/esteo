import "server-only";

import type { ReferralAttributionSource } from "@prisma/client";

import { prisma } from "@/db/client";

export type WorkspaceReferralClaimView = {
  referrerName: string | null;
  referrerEmail: string;
  inputUsed: string;
  inputKind: ReferralAttributionSource;
  claimedAt: string;
  hasPaidSubscription: boolean;
};

function displayInputUsed(params: {
  codeUsed: string | null;
  referrerEmailUsed: string | null;
  attributionSource: ReferralAttributionSource;
  referrerProfileCode: string | null;
}): string {
  if (params.codeUsed) {
    return params.codeUsed;
  }
  if (params.referrerEmailUsed) {
    return params.referrerEmailUsed;
  }
  if (params.referrerProfileCode) {
    return params.referrerProfileCode;
  }
  return "—";
}

export async function getWorkspaceReferralClaimView(
  referredWorkspaceId: string,
): Promise<WorkspaceReferralClaimView | null> {
  const referral = await prisma.referral.findUnique({
    where: { referredWorkspaceId },
    select: {
      attributionSource: true,
      codeUsed: true,
      referrerEmailUsed: true,
      claimedAt: true,
      referrerUser: {
        select: {
          name: true,
          email: true,
          referralProfile: {
            select: { code: true },
          },
        },
      },
      referredWorkspace: {
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
      },
    },
  });

  if (!referral) {
    return null;
  }

  const sub = referral.referredWorkspace.billingAccount?.subscription;
  const hasPaidSubscription = Boolean(
    sub?.stripeSubscriptionId &&
      sub.plan !== "FREE" &&
      (sub.status === "ACTIVE" || sub.status === "TRIAL"),
  );

  return {
    referrerName: referral.referrerUser.name,
    referrerEmail: referral.referrerUser.email,
    inputUsed: displayInputUsed({
      codeUsed: referral.codeUsed,
      referrerEmailUsed: referral.referrerEmailUsed,
      attributionSource: referral.attributionSource,
      referrerProfileCode: referral.referrerUser.referralProfile?.code ?? null,
    }),
    inputKind: referral.attributionSource,
    claimedAt: referral.claimedAt.toISOString(),
    hasPaidSubscription,
  };
}
