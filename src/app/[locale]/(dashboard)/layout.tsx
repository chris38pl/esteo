import type { ReactNode } from "react";
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
import { requireAuth } from "@/server/auth/require-auth";
import { canUserCreateWorkspace, countOwnedWorkspaces } from "@/server/permissions/entitlements";
import { isPlatformAdmin } from "@/server/permissions/require-workspace";
import { resolveActiveWorkspace } from "@/server/workspaces/active-workspace";

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
  const activeWorkspaceId = await resolveActiveWorkspace(user.id);
  const [canCreateWorkspace, ownedWorkspaceCount, billingSidebarState, pendingInvitationCount, nextModalInvitation] =
    await Promise.all([
    canUserCreateWorkspace(user.id),
    countOwnedWorkspaces(user.id),
    getBillingSidebarState(user.id),
    countPendingInvitations(user.email),
    workspaces.length > 0 ? getNextModalInvitation(user.email) : Promise.resolve(null),
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
    >
      <DashboardShell locale={resolvedLocale}>{children}</DashboardShell>
    </WorkspaceProvider>
  );
}
