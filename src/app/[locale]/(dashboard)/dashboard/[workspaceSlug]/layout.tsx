import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { resolveStaleBillingHandoff } from "@/features/billing/server/billing-handoff-cleanup";
import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; workspaceSlug: string }>;
}) {
  const { locale: localeParam, workspaceSlug } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  const user = await requireAuth(resolvedLocale);

  // resolveWorkspaceBySlug is React cache()-wrapped — the outer (dashboard) layout already
  // called it with the same args, so this is a free cache hit with no extra DB round-trip.
  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);

  if (!resolved) {
    // Workspace not found or user has no access.
    // Send to /dashboard which will redirect to their own workspace (or onboarding).
    redirect(`/${resolvedLocale}/dashboard`);
  }

  await resolveStaleBillingHandoff(resolved.workspace.id);

  if (resolved.matchedViaAlias) {
    // The URL uses an old slug (alias). Redirect to the canonical current slug,
    // preserving the full subpath and search params.
    const headersList = await headers();
    const currentPath =
      headersList.get("x-pathname") ??
      `/${resolvedLocale}/dashboard/${resolved.canonicalSlug}`;
    const canonicalPath = currentPath.replace(
      `/dashboard/${workspaceSlug}`,
      `/dashboard/${resolved.canonicalSlug}`,
    );
    redirect(canonicalPath);
  }

  return <>{children}</>;
}
