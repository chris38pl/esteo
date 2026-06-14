import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";
import { redirect } from "next/navigation";
import { loadEstimatesForListPage } from "@/features/estimates/server/list-estimates-page-data";
import { EstimatesListPanel } from "@/features/estimates/components/estimates-list-panel";
import { getEstimateRequestFormDataForWorkspace } from "@/features/estimate-requests/server/public-service";
import { dashboardBillingHref } from "@/lib/dashboard-routes";
import {
  deriveEstimateProcessingGate,
  getWorkspaceEntitlements,
} from "@/server/billing/entitlement-service";

export default async function EstimatesPage({
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

  const workspaceId = resolved.workspace.id;

  const [estimates, createFormData, entitlements] = await Promise.all([
    loadEstimatesForListPage(workspaceId, resolvedLocale),
    getEstimateRequestFormDataForWorkspace({
      workspaceId,
      locale: resolvedLocale,
    }),
    getWorkspaceEntitlements(workspaceId),
  ]);

  const processingGate = deriveEstimateProcessingGate(entitlements);
  const createEstimateGate = {
    allowed: processingGate.allowed,
    reason: processingGate.allowed ? undefined : processingGate.reason,
    estimatesThisMonth: entitlements.usage.estimatesThisMonth,
    maxEstimatesPerMonth: entitlements.limits.maxEstimatesPerMonth,
  };
  const isOwner = resolved.workspace.ownerId === user.id;
  const billingHref = isOwner ? dashboardBillingHref(resolvedLocale, workspaceSlug) : null;

  if (!createFormData) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  return (
    <EstimatesListPanel
      estimates={estimates}
      createFormData={createFormData}
      createEstimateGate={createEstimateGate}
      billingHref={billingHref}
      workspaceId={resolved.workspace.id}
      workspaceSlug={workspaceSlug}
      locale={resolvedLocale}
    />
  );
}
