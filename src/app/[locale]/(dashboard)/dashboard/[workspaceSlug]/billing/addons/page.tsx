import { Suspense } from "react";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { WorkspaceAddonsPanel } from "@/features/billing/components/workspace-addons-panel";
import { getWorkspaceBillingAddonsPageData } from "@/features/billing/server/get-workspace-billing-addons-page-data";
import { resolveWorkspaceForBilling } from "@/features/billing/server/billing-permissions";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";

export default async function WorkspaceBillingAddonsPage({
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

  const data = await getWorkspaceBillingAddonsPageData(resolved.workspace.id);

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-[1400px] flex-1 flex-col pb-8">
      <Suspense fallback={null}>
        <WorkspaceAddonsPanel
          workspaceId={resolved.workspace.id}
          workspaceSlug={resolved.canonicalSlug}
          locale={resolvedLocale}
          data={data}
          canManageBilling={resolved.permissions.canChangePlanOrAddons}
        />
      </Suspense>
    </div>
  );
}
