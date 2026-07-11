import { redirect } from "next/navigation";

import { getAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import { hasPendingInboxItems } from "@/features/workspaces/server/inbox-state";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveActiveWorkspace } from "@/server/workspaces/active-workspace";
import { ClientRedirect } from "@/components/routing/client-redirect";
import { dashboardEstimatesHref } from "@/lib/dashboard-routes";

/**
 * Bare /dashboard landing - immediately redirects to the appropriate destination:
 *  - User's last active workspace:  /dashboard/[slug]/estimates
 *  - No workspaces, pending invites: /dashboard/invitations
 *  - No workspaces, no invites:      /dashboard/onboarding
 *
 * Uses ClientRedirect for onboarding/invitations (avoids stalled RSC streams during
 * Clerk's post-login double soft-navigation - see docs/incidents/2026-06-01).
 * Uses server redirect() for workspace landing so /dashboard/[slug]/estimates is a full
 * document navigation (client router.replace can 404 on RSC flights with Clerk).
 */
export default async function DashboardRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  const user = await requireAuth(resolvedLocale);
  const accessible = await getAccessibleWorkspaces(user.id);

  if (accessible.length === 0) {
    const hasPending = await hasPendingInboxItems(user.email);
    return (
      <ClientRedirect
        href={`/${resolvedLocale}/dashboard/${hasPending ? "invitations" : "onboarding"}`}
      />
    );
  }

  // Use last-active workspace (cookie / DB) as the landing target.
  // This is the only remaining use of cookie-based resolution.
  const activeId = await resolveActiveWorkspace(user.id);
  const target = accessible.find((w) => w.id === activeId) ?? accessible[0];

  redirect(dashboardEstimatesHref(resolvedLocale, target.slug));
}
