import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardDebugPanel } from "@/components/dashboard/dashboard-debug-panel";
import { getDashboardDebugData } from "@/features/dashboard/server/get-dashboard-debug-data";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);
  const t = await getTranslations("dashboard");
  const user = await requireAuth(resolvedLocale);
  const debugData = await getDashboardDebugData(user);

  return (
    <main className="flex-1">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <UserButton />
      </div>

      <DashboardDebugPanel data={debugData} locale={resolvedLocale} />

      <Link
        href={`/${resolvedLocale}`}
        className="mt-6 inline-flex text-sm font-medium text-primary underline"
      >
        {t("actions.backHome")}
      </Link>
    </main>
  );
}
