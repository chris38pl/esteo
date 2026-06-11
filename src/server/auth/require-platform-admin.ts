import type { User } from "@prisma/client";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/locale";
import { isPlatformAdmin } from "@/server/permissions/require-workspace";
import { requireAuth } from "@/server/auth/require-auth";
import { syncUserFromClerk } from "@/server/auth/sync-user";

/** Guard for platform-admin-only routes under /dashboard/admin. */
export async function assertPlatformAdminAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);

  if (!isPlatformAdmin(user)) {
    redirect(`/${locale}/dashboard`);
  }

  return user;
}

/** API guard — returns null when unauthenticated or not a platform admin. */
export async function getPlatformAdminUserOrNull(): Promise<User | null> {
  const user = await syncUserFromClerk();

  if (!user || !isPlatformAdmin(user)) {
    return null;
  }

  return user;
}
