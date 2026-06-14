import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { AdminIssuesTable } from "@/features/issues/components/admin-issues-table";
import { listIssuesForAdmin } from "@/features/issues/server/repository";
import { getServerTranslations, resolveRequestLocale } from "@/i18n/request-locale";
import { isIssueTrackerEnabled } from "@/lib/issue-tracker/guard";
import type { Locale } from "@/lib/locale";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";

export default async function AdminIssuesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  if (!isIssueTrackerEnabled()) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  await assertPlatformAdminAccess(resolvedLocale);
  const t = await getServerTranslations(resolvedLocale, "issues");
  const items = await listIssuesForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
      </div>

      <AdminIssuesTable items={items} locale={resolvedLocale} />
    </div>
  );
}
