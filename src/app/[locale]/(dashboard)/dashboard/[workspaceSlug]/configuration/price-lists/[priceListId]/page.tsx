import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { SyncDashboardBreadcrumbDetail } from "@/components/layout/dashboard-top-nav/sync-dashboard-breadcrumb-detail";
import { PriceListEditor } from "@/features/price-lists/components/price-list-editor";
import { priceListToEditorDraft } from "@/features/price-lists/lib/price-list-editor-draft";
import { getPriceListWorkspaceData } from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { WorkspaceError } from "@/server/permissions/errors";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export default async function EditPriceListPage({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string; priceListId: string }>;
}) {
  const { locale, workspaceSlug, priceListId } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  let data;
  try {
    data = await getPriceListWorkspaceData(user, resolved.workspace.id, priceListId);
  } catch (error) {
    if (error instanceof WorkspaceError) {
      redirect(
        `/${resolvedLocale}/dashboard/${resolved.canonicalSlug}/configuration?tab=priceLists`,
      );
    }
    throw error;
  }

  if (!data.priceList) {
    redirect(
      `/${resolvedLocale}/dashboard/${resolved.canonicalSlug}/configuration?tab=priceLists`,
    );
  }

  return (
    <>
      <SyncDashboardBreadcrumbDetail label={data.priceList.name} />
      <PriceListEditor
        priceListId={data.priceList.id}
        initialDraft={priceListToEditorDraft(data.priceList)}
        initialUpdatedAt={data.priceList.updatedAt}
        priceLists={data.priceLists}
        defaultPriceListId={data.defaultPriceListId}
        workspaceId={resolved.workspace.id}
        workspaceSlug={resolved.canonicalSlug}
        locale={resolvedLocale}
        access={data.access}
      />
    </>
  );
}
