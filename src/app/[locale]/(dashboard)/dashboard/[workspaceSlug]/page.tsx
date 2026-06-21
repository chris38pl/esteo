import { setRequestLocale } from "next-intl/server";

import { DashboardOverviewPanel } from "@/features/dashboard/components/dashboard-overview-panel";
import { resolveDashboardGreetingName } from "@/features/dashboard/lib/resolve-dashboard-greeting-name";
import { getDashboardKpiStats } from "@/features/dashboard/server/get-dashboard-kpi-stats";
import { dashboardEstimatesHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { isPlatformAdmin } from "@/server/permissions/require-workspace";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";
import { redirect } from "next/navigation";

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
}) {
  const { locale, workspaceSlug } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  if (!isPlatformAdmin(user)) {
    redirect(dashboardEstimatesHref(resolvedLocale, resolved.canonicalSlug));
  }

  const greetingName = resolveDashboardGreetingName(user.name, user.email);
  const kpiStats = await getDashboardKpiStats(resolved.workspace.id);

  return (
    <DashboardOverviewPanel
      greetingName={greetingName}
      workspaceSlug={workspaceSlug}
      locale={resolvedLocale}
      kpiStats={kpiStats}
    />
  );
}
