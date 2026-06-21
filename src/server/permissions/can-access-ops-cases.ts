import type { PlatformRole } from "@prisma/client";

export function canAccessOpsCases(user: { platformRole: PlatformRole }): boolean {
  if (user.platformRole === "PLATFORM_ADMIN") {
    return true;
  }

  return false;
}
