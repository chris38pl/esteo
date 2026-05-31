import { currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { cache } from "react";

import { ensureBillingAccount } from "@/features/billing/server/provision-billing-account";
import { prisma } from "@/db/client";

function getPrimaryEmail(
  clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
): string {
  const primary = clerkUser.emailAddresses.find(
    (entry) => entry.id === clerkUser.primaryEmailAddressId,
  );

  return primary?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
}

export const syncUserFromClerk = cache(async (): Promise<User | null> => {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = getPrimaryEmail(clerkUser);

  if (!email) {
    throw new Error("Clerk user is missing a primary email address.");
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const avatarUrl = clerkUser.imageUrl ?? null;

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    create: {
      clerkId: clerkUser.id,
      email,
      name,
      avatarUrl,
    },
    update: {
      email,
      name,
      avatarUrl,
    },
  });

  await ensureBillingAccount(user.id);

  return user;
});
