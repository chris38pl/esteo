import type { BillingAccount } from "@prisma/client";

import { prisma } from "@/db/client";

export async function ensureBillingAccount(userId: string): Promise<BillingAccount> {
  const existing = await prisma.billingAccount.findUnique({
    where: { ownerUserId: userId },
  });

  if (existing) {
    return existing;
  }

  return prisma.billingAccount.create({
    data: {
      ownerUserId: userId,
      subscription: {
        create: {
          plan: "FREE",
          // MVP: FREE accounts are usable with ACTIVE status (not a paid indicator).
          status: "ACTIVE",
        },
      },
    },
  });
}

export async function getSubscriptionForUser(userId: string) {
  const billingAccount = await prisma.billingAccount.findUnique({
    where: { ownerUserId: userId },
    include: { subscription: true },
  });

  return billingAccount?.subscription ?? null;
}
