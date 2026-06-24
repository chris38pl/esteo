import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { RequestsListPanel } from "@/features/estimate-requests/components/requests-list-panel";
import { listWorkspaceEstimateRequests } from "@/features/estimate-requests/server/workspace-requests";
import { getGenerationConfigurationOptions } from "@/features/workspace-configuration/server/service";
import { dashboardBillingHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import {
  deriveEstimateProcessingGate,
  getWorkspaceEntitlements,
} from "@/server/billing/entitlement-service";
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

  const [requests, entitlements, generationConfiguration] = await Promise.all([
    listWorkspaceEstimateRequests(resolved.workspace.id, resolvedLocale),
    getWorkspaceEntitlements(resolved.workspace.id),
    getGenerationConfigurationOptions(resolved.workspace.id),
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

  return (
    <RequestsListPanel
      requests={requests}
      workspaceSlug={workspaceSlug}
      workspaceId={resolved.workspace.id}
      createEstimateGate={createEstimateGate}
      billingHref={billingHref}
      generationConfiguration={generationConfiguration}
      locale={resolvedLocale}
    />
  );
}
