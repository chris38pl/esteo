import type { User } from "@prisma/client";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/locale";
import { isPlatformAdmin } from "@/server/permissions/require-workspace";
import { requireAuth } from "@/server/auth/require-auth";

/** Guard for platform-admin-only routes under /dashboard/admin. */
export async function assertPlatformAdminAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);

  if (!isPlatformAdmin(user)) {
    redirect(`/${locale}/dashboard`);
  }

  return user;
}
