import type { User } from "@prisma/client";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/locale";
import { canAccessIssueTriage } from "@/server/permissions/require-workspace";
import { requireAuth } from "@/server/auth/require-auth";
import { syncUserFromClerk } from "@/server/auth/sync-user";

/** Guard for issue triage routes (/dashboard/admin/issues, /dashboard/qa/issues). */
export async function assertIssueViewerAccess(locale: Locale): Promise<User> {
  const user = await requireAuth(locale);

  if (!canAccessIssueTriage(user)) {
    redirect(`/${locale}/dashboard`);
  }

  return user;
}

/** API guard - returns null when unauthenticated or cannot triage issues. */
export async function getIssueViewerUserOrNull(): Promise<User | null> {
  const user = await syncUserFromClerk();

  if (!user || !canAccessIssueTriage(user)) {
    return null;
  }

  return user;
}
