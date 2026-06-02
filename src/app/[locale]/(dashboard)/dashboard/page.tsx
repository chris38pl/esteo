import { getAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import { hasPendingInvitations } from "@/features/workspaces/server/invitation-inbox";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveActiveWorkspace } from "@/server/workspaces/active-workspace";
import { ClientRedirect } from "@/components/routing/client-redirect";

/**
 * Bare /dashboard landing — immediately redirects to the appropriate destination:
 *  - User's last active workspace:  /dashboard/[slug]
 *  - No workspaces, pending invites: /dashboard/invitations
 *  - No workspaces, no invites:      /dashboard/onboarding
 *
 * Uses ClientRedirect instead of server redirect() to avoid stalled RSC streams
 * during Clerk's post-login double soft-navigation (see docs/incidents/2026-06-01).
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
    const hasPending = await hasPendingInvitations(user.email);
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

  return <ClientRedirect href={`/${resolvedLocale}/dashboard/${target.slug}`} />;
}
