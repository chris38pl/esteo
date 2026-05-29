import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { DashboardShell } from "@/components/layout/app-sidebar/dashboard-shell";
import { WorkspaceProvider } from "@/components/layout/app-sidebar/workspace-context";
import { getBillingSidebarState } from "@/features/billing/server/get-billing-sidebar-state";
import { getAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import { requireAuth } from "@/server/auth/require-auth";
import { canUserCreateWorkspace, countOwnedWorkspaces } from "@/server/permissions/entitlements";
import { resolveActiveWorkspace } from "@/server/workspaces/active-workspace";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const workspaces = await getAccessibleWorkspaces(user.id);
  const activeWorkspaceId = await resolveActiveWorkspace(user.id);
  const [canCreateWorkspace, ownedWorkspaceCount, billingSidebarState] = await Promise.all([
    canUserCreateWorkspace(user.id),
    countOwnedWorkspaces(user.id),
    getBillingSidebarState(user.id),
  ]);
  const canCreateAdditionalWorkspace = canCreateWorkspace && ownedWorkspaceCount > 0;

  const workspaceSummaries = workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
  }));

  return (
    <WorkspaceProvider
      workspaces={workspaceSummaries}
      activeWorkspaceId={activeWorkspaceId}
      canCreateWorkspace={canCreateWorkspace}
      canCreateAdditionalWorkspace={canCreateAdditionalWorkspace}
      billingSidebarState={billingSidebarState}
      locale={resolvedLocale}
    >
      <DashboardShell locale={resolvedLocale}>{children}</DashboardShell>
    </WorkspaceProvider>
  );
}
