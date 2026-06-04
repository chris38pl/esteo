import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { SyncDashboardBreadcrumbDetail } from "@/components/layout/dashboard-top-nav/sync-dashboard-breadcrumb-detail";
import { RequestDetailPanel } from "@/features/estimate-requests/components/request-detail-panel";
import { getWorkspaceEstimateRequestDetail } from "@/features/estimate-requests/server/workspace-requests";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export default async function WorkspaceRequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string; requestId: string }>;
}) {
  const { locale, workspaceSlug, requestId } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  const request = await getWorkspaceEstimateRequestDetail({
    requestId,
    workspaceId: resolved.workspace.id,
    locale: resolvedLocale,
  });

  if (!request) {
    notFound();
  }

  const propertyTypeRow = request.industryFields.find(
    (field) => field.key === "property_type",
  );
  const investmentPropertyType =
    propertyTypeRow && propertyTypeRow.value !== "—" ? propertyTypeRow.value : null;

  const breadcrumbLabel = request.requestNumber?.trim() || null;

  return (
    <>
      <SyncDashboardBreadcrumbDetail label={breadcrumbLabel} />
      <RequestDetailPanel
        request={request}
        workspaceSlug={workspaceSlug}
        locale={resolvedLocale}
        investmentPropertyType={investmentPropertyType}
      />
    </>
  );
}
