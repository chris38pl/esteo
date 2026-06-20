import type { ReactNode } from "react";
import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { DashboardShell } from "@/components/layout/app-sidebar/dashboard-shell";
import { WorkspaceProvider } from "@/components/layout/app-sidebar/workspace-context";
import type { ModalInboxItemView } from "@/features/workspaces/components/inbox-modal-types";
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
import { countPendingInboxItems } from "@/features/workspaces/server/inbox-state";
import { RESERVED_DASHBOARD_SLUGS } from "@/features/workspaces/server/slug-availability";
import { toCurrentUserProfile } from "@/lib/avatars/user-avatar-presets";
import { requireAuth } from "@/server/auth/require-auth";
import {
  canInviteWorkspaceMembers,
  canUserCreateWorkspace,
  countOwnedWorkspaces,
} from "@/server/permissions/entitlements";
import { isPlatformAdmin, isQaTester } from "@/server/permissions/require-workspace";
import { isIssueTrackerEnabled } from "@/lib/issue-tracker/guard";
import { listPinnedEstimatesForSidebar } from "@/features/estimates/server/pinned-estimates";
import { getWorkspaceStorageSummary } from "@/features/attachments/server/assert-workspace-storage";
import { getWorkspaceLogoUrlsByIds } from "@/features/workspaces/server/logo-service";
import {
  resolveActiveWorkspace,
  resolveWorkspaceBySlug,
} from "@/server/workspaces/active-workspace";
import {
  canAccessPartnerProgram,
  canUserGenerateReferrals,
} from "@/features/referrals/server/referral-eligibility";

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
  const [workspaces, billingPayerWorkspaceIds] = await Promise.all([
    getAccessibleWorkspaces(user.id),
    getBillingPayerWorkspaceIdsForUser(user.id),
  ]);
  const issueTrackerEnabled = isIssueTrackerEnabled();

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
        canInviteMembers={false}
        billingSidebarState={{ variant: "upsell", currentPlan: "FREE", targetPlan: "PRO" }}
        isPlatformAdmin={isPlatformAdmin(user)}
        isQaTester={isQaTester(user)}
        issueTrackerEnabled={issueTrackerEnabled}
        partnerProgramVisible={false}
        currentUser={currentUser}
        locale={resolvedLocale}
        pendingInvitationCount={0}
        modalInboxItem={null}
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
    if (resolved) {
      activeWorkspaceId = resolved.workspace.id;
    } else {
      const billingResolved = await resolveWorkspaceForBilling(slugFromUrl, user.id);
      activeWorkspaceId = billingResolved?.workspace.id ?? null;
    }
  } else {
    activeWorkspaceId = await resolveActiveWorkspace(user.id);
  }
  const [canCreateWorkspace, ownedWorkspaceCount, billingSidebarState, pendingInvitationCount, nextModalInboxItem] =
    await Promise.all([
    canUserCreateWorkspace(user.id),
    countOwnedWorkspaces(user.id),
    getBillingSidebarState(activeWorkspaceId),
    countPendingInboxItems(user.email),
    getNextModalInboxItem(user.email),
  ]);
  const canCreateAdditionalWorkspace = canCreateWorkspace && ownedWorkspaceCount > 0;

  const logoUrlsByWorkspaceId = await getWorkspaceLogoUrlsByIds(
    workspaces.map((workspace) => workspace.id),
  );

  const workspaceSummaries = workspaces.map((workspace) => {
    const storage = getWorkspaceStorageSummary({
      attachmentStorageUsedBytes: workspace.attachmentStorageUsedBytes,
      attachmentStorageLimitBytes: workspace.attachmentStorageLimitBytes,
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      appearanceTheme: workspace.appearanceTheme,
      isOwner: workspace.ownerId === user.id,
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
  const [canAccessPartner, canGenerateReferrals] = activeWorkspaceSummary?.isOwner
    ? await Promise.all([
        canAccessPartnerProgram(user.id),
        canUserGenerateReferrals(user.id),
      ])
    : [false, false];
  const partnerProgramVisible =
    Boolean(activeWorkspaceSummary?.isOwner) && (canAccessPartner || canGenerateReferrals);

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
      isPlatformAdmin={isPlatformAdmin(user)}
      isQaTester={isQaTester(user)}
      issueTrackerEnabled={issueTrackerEnabled}
      partnerProgramVisible={partnerProgramVisible}
      currentUser={currentUser}
      locale={resolvedLocale}
      pendingInvitationCount={pendingInvitationCount}
      modalInboxItem={
        nextModalInboxItem ? toModalInboxItemView(nextModalInboxItem) : null
      }
      pinnedEstimates={pinnedEstimates}
      activeWorkspaceStats={activeWorkspaceStats}
    >
      <DashboardShell locale={resolvedLocale}>{children}</DashboardShell>
    </WorkspaceProvider>
  );
}
