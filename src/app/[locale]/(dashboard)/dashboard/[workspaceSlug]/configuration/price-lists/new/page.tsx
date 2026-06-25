import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PriceListEditor } from "@/features/price-lists/components/price-list-editor";
import { emptyPriceListDraft } from "@/features/price-lists/lib/price-list-editor-draft";
import { getPriceListWorkspaceData } from "@/features/workspace-configuration/server/service";
import { dashboardEstimatesHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { WorkspaceError } from "@/server/permissions/errors";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export default async function NewPriceListPage({
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

  let workspaceData;
  try {
    workspaceData = await getPriceListWorkspaceData(user, resolved.workspace.id);
  } catch (error) {
    if (error instanceof WorkspaceError) {
      redirect(dashboardEstimatesHref(resolvedLocale, resolved.canonicalSlug));
    }
    throw error;
  }

  const t = await getTranslations("workspaces.configuration.priceLists.editor");

  return (
    <PriceListEditor
      priceListId={null}
      initialDraft={emptyPriceListDraft(t("defaultName"))}
      priceLists={workspaceData.priceLists}
      defaultPriceListId={workspaceData.defaultPriceListId}
      workspaceId={resolved.workspace.id}
      workspaceSlug={resolved.canonicalSlug}
      locale={resolvedLocale}
      access={workspaceData.access}
    />
  );
}
