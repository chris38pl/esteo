import type { ReactNode } from "react";
import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { DashboardShell } from "@/components/layout/app-sidebar/dashboard-shell";
import { WorkspaceProvider } from "@/components/layout/app-sidebar/workspace-context";
import { toReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { getBillingSidebarState } from "@/features/billing/server/get-billing-sidebar-state";
import { getAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import { getActiveWorkspaceMembersData } from "@/features/workspaces/server/get-active-workspace-card-data";
import {
  countPendingInvitations,
  getNextModalInvitation,
} from "@/features/workspaces/server/invitation-inbox";
import { RESERVED_DASHBOARD_SLUGS } from "@/features/workspaces/server/slug-availability";
import { requireAuth } from "@/server/auth/require-auth";
import { canUserCreateWorkspace, countOwnedWorkspaces } from "@/server/permissions/entitlements";
import { isPlatformAdmin } from "@/server/permissions/require-workspace";
import { listPinnedEstimatesForSidebar } from "@/features/estimates/server/pinned-estimates";
import {
  resolveActiveWorkspace,
  resolveWorkspaceBySlug,
} from "@/server/workspaces/active-workspace";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {


  const { locale: localeParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const workspaces = await getAccessibleWorkspaces(user.id);

  // New users have no workspaces yet and will be immediately redirected to
  // onboarding by the child layout. Skip the remaining sidebar data fetches
  // (~1900ms) to prevent them from competing with the concurrent onboarding
  // RSC requests that Clerk's double-navigate creates.
  if (workspaces.length === 0) {
    return (
      <WorkspaceProvider
        workspaces={[]}
        activeWorkspaceId={null}
        memberPreviews={[]}
        memberTotalCount={0}
        canCreateWorkspace={false}
        canCreateAdditionalWorkspace={false}
        billingSidebarState={{ variant: "upsell", currentPlan: "FREE", targetPlan: "PRO" }}
        isPlatformAdmin={isPlatformAdmin(user)}
        locale={resolvedLocale}
        pendingInvitationCount={0}
        modalInvitation={null}
        pinnedEstimates={[]}
      >
        <DashboardShell locale={resolvedLocale}>{children}</DashboardShell>
      </WorkspaceProvider>
    );
  }

  // Determine active workspace.
  // For workspace-scoped routes (/dashboard/[workspaceSlug]/...) we read the slug from the URL
  // (injected by middleware as x-pathname). For admin and pre-workspace routes we fall back
  // to the cookie-based resolver so the sidebar still reflects the user's last active workspace.
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const segments = pathname.split("/");
  const dashIdx = segments.findIndex((s) => s === "dashboard");
  const possibleSlug = dashIdx >= 0 ? segments[dashIdx + 1] : undefined;
  const slugFromUrl =
    possibleSlug && possibleSlug !== "" && !RESERVED_DASHBOARD_SLUGS.has(possibleSlug)
      ? possibleSlug
      : null;

  let activeWorkspaceId: string | null = null;
  if (slugFromUrl) {
    const resolved = await resolveWorkspaceBySlug(slugFromUrl, user.id);
    activeWorkspaceId = resolved?.workspace.id ?? null;
  } else {
    activeWorkspaceId = await resolveActiveWorkspace(user.id);
  }
  const [canCreateWorkspace, ownedWorkspaceCount, billingSidebarState, pendingInvitationCount, nextModalInvitation] =
    await Promise.all([
    canUserCreateWorkspace(user.id),
    countOwnedWorkspaces(user.id),
    getBillingSidebarState(user.id),
    countPendingInvitations(user.email),
    getNextModalInvitation(user.email),
  ]);
  const canCreateAdditionalWorkspace = canCreateWorkspace && ownedWorkspaceCount > 0;

  const workspaceSummaries = workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    appearanceTheme: workspace.appearanceTheme,
    isOwner: workspace.ownerId === user.id,
  }));

  const membersData = activeWorkspaceId
    ? await getActiveWorkspaceMembersData(activeWorkspaceId)
    : { previews: [], totalCount: 0 };

  const activeWorkspaceSummary = workspaceSummaries.find((w) => w.id === activeWorkspaceId);
  const pinnedEstimates =
    activeWorkspaceId && activeWorkspaceSummary
      ? await listPinnedEstimatesForSidebar({
          userId: user.id,
          workspaceId: activeWorkspaceId,
          workspaceSlug: activeWorkspaceSummary.slug,
        })
      : [];

  return (
    <WorkspaceProvider
      workspaces={workspaceSummaries}
      activeWorkspaceId={activeWorkspaceId}
      memberPreviews={membersData.previews}
      memberTotalCount={membersData.totalCount}
      canCreateWorkspace={canCreateWorkspace}
      canCreateAdditionalWorkspace={canCreateAdditionalWorkspace}
      billingSidebarState={billingSidebarState}
      isPlatformAdmin={isPlatformAdmin(user)}
      locale={resolvedLocale}
      pendingInvitationCount={pendingInvitationCount}
      modalInvitation={
        nextModalInvitation ? toReceivedInvitationView(nextModalInvitation) : null
      }
      pinnedEstimates={pinnedEstimates}
    >
      <DashboardShell locale={resolvedLocale}>{children}</DashboardShell>
    </WorkspaceProvider>
  );
}
