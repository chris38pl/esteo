import "server-only";

import type { User } from "@prisma/client";

import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { prisma } from "@/db/client";

/**
 * Sets the user's avatar to a preset. Shared by the web server action and the
 * Client API so the profile-update logic lives in exactly one place.
 */
export async function updateUserAvatarPreset(
  userId: string,
  preset: AvatarPreset,
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      avatarPreset: preset,
      avatarSource: "PRESET",
      avatarUrl: null,
    },
  });
}
