import { currentUser } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import type { AvatarSource, User } from "@prisma/client";
import { cache } from "react";

import { prisma } from "@/db/client";
import { isAvatarPreset, pickDefaultAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import { isUniqueConstraintError } from "@/lib/database/is-unique-constraint-error";
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

async function syncUserRecord(input: {
  clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>;
  email: string;
  name: string | null;
}): Promise<User | null> {
  const { clerkUser, email, name } = input;

  const existingByClerkId = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true, avatarPreset: true, avatarSource: true, deletedAt: true },
  });

  if (existingByClerkId?.deletedAt) {
    return null;
  }

  const avatarFields = resolveAvatarFields(clerkUser, existingByClerkId);

  if (existingByClerkId) {
    return prisma.user.update({
      where: { id: existingByClerkId.id },
      data: {
        email,
        name,
        ...avatarFields,
      },
    });
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true, avatarPreset: true, avatarSource: true, deletedAt: true },
  });

  if (existingByEmail) {
    if (existingByEmail.deletedAt) {
      return null;
    }

    // Same email, new Clerk user id — re-link after dev re-registration or auth path change.
    const relinkAvatarFields = resolveAvatarFields(clerkUser, existingByEmail);
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        clerkId: clerkUser.id,
        name,
        ...relinkAvatarFields,
      },
    });
  }

  try {
    return await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email,
        name,
        ...avatarFields,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const racedUser = await prisma.user.findFirst({
      where: {
        OR: [{ clerkId: clerkUser.id }, { email }],
      },
      select: { id: true, avatarPreset: true, avatarSource: true, deletedAt: true },
    });

    if (!racedUser || racedUser.deletedAt) {
      throw error;
    }

    const racedAvatarFields = resolveAvatarFields(clerkUser, racedUser);
    return prisma.user.update({
      where: { id: racedUser.id },
      data: {
        clerkId: clerkUser.id,
        email,
        name,
        ...racedAvatarFields,
      },
    });
  }
}

export const syncUserFromClerk = cache(async (): Promise<User | null> => {
  let clerkUser: Awaited<ReturnType<typeof currentUser>>;
  try {
    clerkUser = await currentUser();
  } catch (error) {
    if (
      isClerkAPIResponseError(error) &&
      (error.status === 404 || error.errors?.[0]?.code === "resource_not_found")
    ) {
      return null;
    }
    throw error;
  }

  if (!clerkUser) {
    return null;
  }

  const email = getPrimaryEmail(clerkUser);

  if (!email) {
    throw new Error("Clerk user is missing a primary email address.");
  }

  const name = resolveUserDisplayName(clerkUser);

  try {
    const user = await syncUserRecord({ clerkUser, email, name });

    if (!user) {
      return null;
    }

    const { linkPendingTransfersToUser } = await import(
      "@/features/workspaces/server/ownership-transfer"
    );
    await linkPendingTransfersToUser(user.id, email);

    // Billing is provisioned per workspace at creation time, not per user at login.
    return user;
  } catch (error) {
    throwIfDatabaseUnavailable(error, "syncUserFromClerk");
  }
});
