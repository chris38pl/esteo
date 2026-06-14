import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { WorkspaceUsagePanel } from "@/features/workspace-usage/components/workspace-usage-panel";
import { getWorkspaceUsagePageData } from "@/features/workspace-usage/server/get-workspace-usage-page-data";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { requireRole } from "@/server/permissions/require-workspace";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export default async function WorkspaceUsagePage({
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

  try {
    await requireRole(user, resolved.workspace.id, "MEMBER");
  } catch {
    redirect(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}`);
  }

  const data = await getWorkspaceUsagePageData(resolved.workspace.id);

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-[1400px] flex-1 flex-col pb-8">
      <WorkspaceUsagePanel
        workspaceId={resolved.workspace.id}
        workspaceSlug={resolved.canonicalSlug}
        data={data}
      />
    </div>
  );
}
