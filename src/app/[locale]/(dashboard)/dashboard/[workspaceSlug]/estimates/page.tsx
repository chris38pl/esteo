import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";
import { redirect } from "next/navigation";
import { listEstimates } from "@/features/estimates/server/repository";
import { EstimatesListPanel } from "@/features/estimates/components/estimates-list-panel";

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

  const estimates = await listEstimates(resolved.workspace.id);

  return (
    <EstimatesListPanel
      estimates={estimates}
      workspaceId={resolved.workspace.id}
      workspaceSlug={workspaceSlug}
      locale={resolvedLocale}
    />
  );
}
