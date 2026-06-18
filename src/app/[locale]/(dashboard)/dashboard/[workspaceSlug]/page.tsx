import { setRequestLocale } from "next-intl/server";

import { DashboardOverviewPanel } from "@/features/dashboard/components/dashboard-overview-panel";
import { resolveDashboardGreetingName } from "@/features/dashboard/lib/resolve-dashboard-greeting-name";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
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

  const greetingName = resolveDashboardGreetingName(user.name, user.email);

  return (
    <DashboardOverviewPanel
      greetingName={greetingName}
      workspaceSlug={workspaceSlug}
      locale={resolvedLocale}
    />
  );
}
