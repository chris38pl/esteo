import { setRequestLocale } from "next-intl/server";

import { AdminWorkspacesPanel } from "@/features/workspaces/components/admin-workspaces-panel";
import { listAdminWorkspaces } from "@/features/workspaces/server/admin-workspaces";
import { getServerTranslations, resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";

export default async function AdminWorkspacesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  await assertPlatformAdminAccess(resolvedLocale);
  const t = await getServerTranslations(resolvedLocale, "admin.workspaces");
  const workspaces = await listAdminWorkspaces();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AdminWorkspacesPanel locale={resolvedLocale} initialWorkspaces={workspaces} />
    </div>
  );
}
