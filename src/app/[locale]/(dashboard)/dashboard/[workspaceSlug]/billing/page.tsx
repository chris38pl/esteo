import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { WorkspaceBillingPanel } from "@/features/billing/components/workspace-billing-panel";
import { getWorkspaceBillingPageData } from "@/features/billing/server/get-workspace-billing-page-data";
import { resolveWorkspaceForBilling } from "@/features/billing/server/billing-permissions";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";

export default async function WorkspaceBillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { locale, workspaceSlug } = await params;
  const { checkout } = await searchParams;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const resolved = await resolveWorkspaceForBilling(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  if (checkout === "success") {
    redirect(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}/billing/checkout-success`);
  }

  const pageData = await getWorkspaceBillingPageData(resolved.workspace.id);
  const data = {
    ...pageData,
    canManageBilling: resolved.permissions.canManageBilling,
    canChangePlanOrAddons: resolved.permissions.canChangePlanOrAddons,
    canPurchaseSubscription: resolved.permissions.canPurchaseSubscription,
    canResumeSubscription: resolved.permissions.canResumeSubscription,
    billingHandoffActive: resolved.permissions.billingHandoffActive,
    billingOwnershipState: resolved.permissions.billingOwnershipState,
  };

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-[1400px] flex-1 flex-col pb-8">
      <WorkspaceBillingPanel
        workspaceId={resolved.workspace.id}
        workspaceSlug={resolved.canonicalSlug}
        locale={resolvedLocale}
        data={data}
      />
    </div>
  );
}
