import type { PlatformRole } from "@prisma/client";

import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { prisma } from "@/db/client";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";

export type ProductTeamMember = {
  id: string;
  displayName: string;
  platformRole: Exclude<PlatformRole, "NONE">;
  imageUrl: string | null;
  avatarPreset: AvatarPreset | null;
};

const PRODUCT_ROLE_ORDER: Record<Exclude<PlatformRole, "NONE">, number> = {
  PLATFORM_ADMIN: 0,
  QA_TESTER: 1,
};

export async function listProductTeamMembers(): Promise<ProductTeamMember[]> {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      platformRole: { not: "NONE" },
    },
    select: {
      id: true,
      name: true,
      email: true,
      platformRole: true,
      avatarUrl: true,
      avatarPreset: true,
      avatarSource: true,
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

  return users
    .map((user) => {
      const preset = isAvatarPreset(user.avatarPreset) ? user.avatarPreset : null;
      const usePresetAvatar = user.avatarSource === "PRESET" || !user.avatarUrl?.trim();

      return {
        id: user.id,
        displayName: user.name?.trim() || user.email,
        platformRole: user.platformRole as Exclude<PlatformRole, "NONE">,
        imageUrl: usePresetAvatar ? null : user.avatarUrl,
        avatarPreset: preset,
      };
    })
    .sort((a, b) => {
      const roleDiff = PRODUCT_ROLE_ORDER[a.platformRole] - PRODUCT_ROLE_ORDER[b.platformRole];
      if (roleDiff !== 0) {
        return roleDiff;
      }

      return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" });
    });
}
