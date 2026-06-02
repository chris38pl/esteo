import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";
import { requireRole } from "@/server/permissions/require-workspace";
import { PermissionError } from "@/server/permissions/errors";

export default async function WorkspaceSettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; workspaceSlug: string }>;
}) {
  const { locale: localeParam, workspaceSlug } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  const user = await requireAuth(resolvedLocale);

  // resolveWorkspaceBySlug is React cache()-wrapped — free hit from parent layout.
  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  try {
    await requireRole(user, resolved.workspace.id, "OWNER");
  } catch (error) {
    if (error instanceof PermissionError) {
      redirect(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}`);
    }
    throw error;
  }

  return <>{children}</>;
}
