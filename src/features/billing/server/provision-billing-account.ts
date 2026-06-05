import type { BillingAccount } from "@prisma/client";

import { prisma } from "@/db/client";
import { isUniqueConstraintError } from "@/lib/database/is-unique-constraint-error";

export async function ensureBillingAccount(userId: string): Promise<BillingAccount> {
  try {
    return await prisma.billingAccount.upsert({
      where: { ownerUserId: userId },
      create: {
        ownerUserId: userId,
        subscription: {
          create: {
            plan: "FREE",
            // MVP: FREE accounts are usable with ACTIVE status (not a paid indicator).
            status: "ACTIVE",
          },
        },
      },
      update: {},
    });
  } catch (error) {
    if (isUniqueConstraintError(error, "ownerUserId")) {
      return prisma.billingAccount.findUniqueOrThrow({
        where: { ownerUserId: userId },
      });
    }

    throw error;
  }
}

export async function getSubscriptionForUser(userId: string) {
  const billingAccount = await prisma.billingAccount.findUnique({
    where: { ownerUserId: userId },
    include: { subscription: true },
  });

  return billingAccount?.subscription ?? null;
}
