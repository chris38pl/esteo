import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { RequestsListPanel } from "@/features/estimate-requests/components/requests-list-panel";
import { listWorkspaceEstimateRequests } from "@/features/estimate-requests/server/workspace-requests";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export default async function WorkspaceRequestsPage({
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

  const requests = await listWorkspaceEstimateRequests(
    resolved.workspace.id,
    resolvedLocale,
  );

  return (
    <RequestsListPanel
      requests={requests}
      workspaceSlug={workspaceSlug}
      locale={resolvedLocale}
    />
  );
}
