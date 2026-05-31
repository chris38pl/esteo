import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminWorkspacesPanel } from "@/features/workspaces/components/admin-workspaces-panel";
import { listAdminWorkspaces } from "@/features/workspaces/server/admin-workspaces";
import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";

export default async function AdminWorkspacesPage() {
  const resolvedLocale: Locale = await resolveRequestLocale();

  setRequestLocale(resolvedLocale);

  await assertPlatformAdminAccess(resolvedLocale);
  const t = await getTranslations({ locale: resolvedLocale, namespace: "admin.workspaces" });
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
