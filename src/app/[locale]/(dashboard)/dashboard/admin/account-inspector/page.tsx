import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { DashboardDebugPanel } from "@/components/dashboard/dashboard-debug-panel";
import { getDashboardDebugData } from "@/features/dashboard/server/get-dashboard-debug-data";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";

export default async function AccountInspectorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await assertPlatformAdminAccess(resolvedLocale);
  const t = await getTranslations("admin");
  const debugData = await getDashboardDebugData(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("accountInspector.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("accountInspector.subtitle")}</p>
      </div>

      <DashboardDebugPanel data={debugData} locale={resolvedLocale} />
    </div>
  );
}
