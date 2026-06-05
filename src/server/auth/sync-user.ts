import { currentUser } from "@clerk/nextjs/server";
import type { AvatarSource, User } from "@prisma/client";
import { cache } from "react";

import { ensureBillingAccount } from "@/features/billing/server/provision-billing-account";
import { prisma } from "@/db/client";
import { isAvatarPreset, pickDefaultAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import { resolveUserDisplayName } from "@/server/auth/resolve-user-display-name";
import { throwIfDatabaseUnavailable } from "@/server/db/log-database-unavailable";

function getPrimaryEmail(
  clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
): string {
  const primary = clerkUser.emailAddresses.find(
    (entry) => entry.id === clerkUser.primaryEmailAddressId,
  );

  return primary?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
}

function resolveAvatarFields(
  clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
  existing: {
    avatarPreset: string | null | undefined;
    avatarSource: AvatarSource | undefined;
  } | null,
): {
  avatarUrl: string | null;
  avatarPreset: string | null;
  avatarSource: AvatarSource;
} {
  const existingPreset = isAvatarPreset(existing?.avatarPreset) ? existing.avatarPreset : null;
  const existingSource = existing?.avatarSource;

  if (existingSource === "PRESET" && existingPreset) {
    return {
      avatarUrl: null,
      avatarPreset: existingPreset,
      avatarSource: "PRESET",
    };
  }

  if (clerkUser.hasImage) {
    return {
      avatarUrl: clerkUser.imageUrl ?? null,
      avatarPreset: null,
      avatarSource: "CLERK",
    };
  }

  const preset = existingPreset ?? pickDefaultAvatarPreset(clerkUser.id);

  return {
    avatarUrl: null,
    avatarPreset: preset,
    avatarSource: "PRESET",
  };
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

  const name = resolveUserDisplayName(clerkUser);

  try {
    const existing = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { avatarPreset: true, avatarSource: true },
    });

    const avatarFields = resolveAvatarFields(clerkUser, existing);

    const user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      create: {
        clerkId: clerkUser.id,
        email,
        name,
        ...avatarFields,
      },
      update: {
        email,
        name,
        ...avatarFields,
      },
    });

    await ensureBillingAccount(user.id);

    return user;
  } catch (error) {
    throwIfDatabaseUnavailable(error, "syncUserFromClerk");
  }
});
