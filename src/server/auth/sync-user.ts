import { currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";

import { prisma } from "@/db/client";

function getPrimaryEmail(
  clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
): string {
  const primary = clerkUser.emailAddresses.find(
    (entry) => entry.id === clerkUser.primaryEmailAddressId,
  );

  return primary?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
}

export async function syncUserFromClerk(): Promise<User | null> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = getPrimaryEmail(clerkUser);

  if (!email) {
    throw new Error("Clerk user is missing a primary email address.");
  }

  return prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    create: {
      clerkId: clerkUser.id,
      email,
    },
    update: {
      email,
    },
  });
}
