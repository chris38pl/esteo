import { Suspense } from "react";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { WorkspaceSubscriptionManagePanel } from "@/features/billing/components/workspace-subscription-manage-panel";
import { getWorkspaceBillingManagePageData } from "@/features/billing/server/get-workspace-billing-manage-page-data";
import { resolveWorkspaceForBilling } from "@/features/billing/server/billing-permissions";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";

export default async function WorkspaceBillingManagePage({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
}) {
  const { locale, workspaceSlug } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const resolved = await resolveWorkspaceForBilling(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  const data = await getWorkspaceBillingManagePageData(resolved.workspace.id);

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-[1400px] flex-1 flex-col pb-8">
      <Suspense fallback={null}>
        <WorkspaceSubscriptionManagePanel
          workspaceId={resolved.workspace.id}
          workspaceSlug={resolved.canonicalSlug}
          locale={resolvedLocale}
          data={data}
          canManageBilling={resolved.permissions.canManageBilling}
          canChangePlanOrAddons={resolved.permissions.canChangePlanOrAddons}
          canPurchaseSubscription={resolved.permissions.canPurchaseSubscription}
          billingOwnershipState={resolved.permissions.billingOwnershipState}
          currentPeriodEnd={data.currentPeriodEnd}
        />
      </Suspense>
    </div>
  );
}
