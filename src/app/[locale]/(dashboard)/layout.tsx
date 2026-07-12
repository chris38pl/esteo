import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { createAppMetadata } from "@/features/app/metadata/create-app-metadata";
import { resolvePageTitle } from "@/features/app/metadata/resolve-page-title";
import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { DashboardShell } from "@/components/layout/app-sidebar/dashboard-shell";
import { WorkspaceProvider } from "@/components/layout/app-sidebar/workspace-context";
import { getBillingSidebarState } from "@/features/billing/server/get-billing-sidebar-state";
import {
  getBillingPayerWorkspaceIdsForUser,
  resolveWorkspaceForBilling,
} from "@/features/billing/server/billing-permissions";
import { getAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import { getActiveWorkspaceMembersData } from "@/features/workspaces/server/get-active-workspace-card-data";
import { getActiveWorkspaceMenuStats } from "@/features/workspaces/server/get-active-workspace-menu-stats";
import {
  getNextModalInboxItem,
  toModalInboxItemView,
} from "@/features/workspaces/server/inbox-modal";
import { getNotificationCounts } from "@/features/notifications/server/get-notifications";
import { countPendingInboxItems } from "@/features/workspaces/server/inbox-state";
import { RESERVED_DASHBOARD_SLUGS } from "@/features/workspaces/server/slug-availability";
import { toCurrentUserProfile } from "@/lib/avatars/user-avatar-presets";
import { requireAuth } from "@/server/auth/require-auth";
import {
  canInviteWorkspaceMembers,
  canUserCreateWorkspace,
  countOwnedWorkspaces,
} from "@/server/permissions/entitlements";
import { isPlatformAdmin, isQaTester, hasProductPlatformRole } from "@/server/permissions/require-workspace";
import { isIssueTrackerEnabled } from "@/lib/issue-tracker/guard";
import { listProductTeamMembers } from "@/features/users/server/list-product-team-members";
import { listPinnedEstimatesForSidebar } from "@/features/estimates/server/pinned-estimates";
import { getWorkspaceStorageSummary } from "@/features/attachments/server/assert-workspace-storage";
import { getWorkspaceLogoUrlsByIds } from "@/features/workspaces/server/logo-service";
import {
  resolveActiveWorkspace,
  resolveWorkspaceBySlug,
} from "@/server/workspaces/active-workspace";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = await resolveRequestLocale(localeParam);
  const pathname = (await headers()).get("x-pathname") ?? "";
  const title = await resolvePageTitle({ locale, pathname });
  return createAppMetadata({ title });
}

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
  const currentUser = toCurrentUserProfile(user);
  const userIsPlatformAdmin = isPlatformAdmin(user);
  const [workspaces, billingPayerWorkspaceIds] = await Promise.all([
    getAccessibleWorkspaces(user.id),
    getBillingPayerWorkspaceIdsForUser(user.id),
  ]);
  const issueTrackerEnabled = isIssueTrackerEnabled();
  const canViewProductTeam = hasProductPlatformRole(user);
  const productTeamMembers = canViewProductTeam ? await listProductTeamMembers() : [];

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
  let workspaceResolvedFromUrl: (typeof workspaces)[number] | null = null;
  if (slugFromUrl) {
    const resolved = await resolveWorkspaceBySlug(slugFromUrl, user.id);
    if (resolved) {
      activeWorkspaceId = resolved.workspace.id;
      workspaceResolvedFromUrl = resolved.workspace;
    } else {
      const billingResolved = await resolveWorkspaceForBilling(slugFromUrl, user.id);
      activeWorkspaceId = billingResolved?.workspace.id ?? null;
      workspaceResolvedFromUrl = billingResolved?.workspace ?? null;
    }
  } else {
    activeWorkspaceId = await resolveActiveWorkspace(user.id);
  }

  // New users have no workspaces yet and will be immediately redirected to
  // onboarding by the child layout. Skip the remaining sidebar data fetches
  // (~1900ms) to prevent them from competing with the concurrent onboarding
  // RSC requests that Clerk's double-navigate creates. Platform admins visiting
  // a workspace by URL keep the resolved workspace in the sidebar context.
  if (workspaces.length === 0 && !workspaceResolvedFromUrl) {
    return (
      <WorkspaceProvider
        workspaces={[]}
        activeWorkspaceId={null}
        memberPreviews={[]}
        memberTotalCount={0}
        canCreateWorkspace={false}
        canCreateAdditionalWorkspace={false}
        canInviteMembers={false}
        billingSidebarState={{ variant: "upsell", currentPlan: "FREE", targetPlan: "PRO" }}
        isPlatformAdmin={userIsPlatformAdmin}
        isQaTester={isQaTester(user)}
        canViewProductTeam={canViewProductTeam}
        productTeamMembers={productTeamMembers}
        issueTrackerEnabled={issueTrackerEnabled}
        partnerProgramVisible={false}
        currentUserId={user.id}
        currentUser={currentUser}
        locale={resolvedLocale}
        pendingInvitationCount={0}
        modalInboxItem={null}
        pinnedEstimates={[]}
        notificationCounts={{ total: 0, unread: 0, actionRequired: 0 }}
      >
        <DashboardShell locale={resolvedLocale}>{children}</DashboardShell>
      </WorkspaceProvider>
    );
  }
  const [canCreateWorkspace, ownedWorkspaceCount, billingSidebarState, pendingInvitationCount, nextModalInboxItem, notificationCounts] =
    await Promise.all([
    canUserCreateWorkspace(user.id),
    countOwnedWorkspaces(user.id),
    getBillingSidebarState(activeWorkspaceId),
    countPendingInboxItems(user.email),
    getNextModalInboxItem(user.email),
    getNotificationCounts(user.id),
  ]);
  const canCreateAdditionalWorkspace = canCreateWorkspace && ownedWorkspaceCount > 0;

  const sidebarWorkspaces =
    workspaceResolvedFromUrl && !workspaces.some((workspace) => workspace.id === workspaceResolvedFromUrl?.id)
      ? [...workspaces, workspaceResolvedFromUrl]
      : workspaces;

  const logoUrlsByWorkspaceId = await getWorkspaceLogoUrlsByIds(
    sidebarWorkspaces.map((workspace) => workspace.id),
  );

  const workspaceSummaries = sidebarWorkspaces.map((workspace) => {
    const storage = getWorkspaceStorageSummary({
      attachmentStorageUsedBytes: workspace.attachmentStorageUsedBytes,
      attachmentStorageLimitBytes: workspace.attachmentStorageLimitBytes,
    });
    const isActiveAdminBrowseWorkspace =
      userIsPlatformAdmin && workspace.id === activeWorkspaceId;

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      appearanceTheme: workspace.appearanceTheme,
      isOwner: workspace.ownerId === user.id || isActiveAdminBrowseWorkspace,
      isBillingPayer: billingPayerWorkspaceIds.has(workspace.id),
      logoUrl: logoUrlsByWorkspaceId.get(workspace.id) ?? null,
      storageUsedFormatted: storage.usedFormatted,
      storageLimitFormatted: storage.limitFormatted,
      storageUsedPercent: storage.usedPercent,
    };
  });

  const [membersData, canInviteMembers, activeWorkspaceStats] = activeWorkspaceId
    ? await Promise.all([
        getActiveWorkspaceMembersData(activeWorkspaceId),
        canInviteWorkspaceMembers(activeWorkspaceId),
        getActiveWorkspaceMenuStats(activeWorkspaceId),
      ])
    : [{ previews: [], totalCount: 0 }, false, null];

  const activeWorkspaceSummary = workspaceSummaries.find((w) => w.id === activeWorkspaceId);
  const partnerProgramVisible = Boolean(activeWorkspaceSummary?.isOwner);

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
      canInviteMembers={canInviteMembers}
      billingSidebarState={billingSidebarState}
      isPlatformAdmin={userIsPlatformAdmin}
      isQaTester={isQaTester(user)}
      canViewProductTeam={canViewProductTeam}
      productTeamMembers={productTeamMembers}
      issueTrackerEnabled={issueTrackerEnabled}
      partnerProgramVisible={partnerProgramVisible}
      currentUserId={user.id}
      currentUser={currentUser}
      locale={resolvedLocale}
      pendingInvitationCount={pendingInvitationCount}
      modalInboxItem={
        nextModalInboxItem ? toModalInboxItemView(nextModalInboxItem) : null
      }
      pinnedEstimates={pinnedEstimates}
      activeWorkspaceStats={activeWorkspaceStats}
      notificationCounts={notificationCounts}
    >
      <DashboardShell locale={resolvedLocale}>{children}</DashboardShell>
    </WorkspaceProvider>
  );
}
