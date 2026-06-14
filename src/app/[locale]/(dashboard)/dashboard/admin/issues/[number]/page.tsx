import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { AdminIssueDetailPanel } from "@/features/issues/components/admin-issue-detail-panel";
import { getIssueByNumber } from "@/features/issues/server/repository";
import { getServerTranslations, resolveRequestLocale } from "@/i18n/request-locale";
import { isIssueTrackerEnabled } from "@/lib/issue-tracker/guard";
import type { Locale } from "@/lib/locale";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";

export default async function AdminIssueDetailPage({
  params,
}: {
  params: Promise<{ locale: string; number: string }>;
}) {
  const { locale: localeParam, number: numberParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);
  const number = Number.parseInt(numberParam, 10);

  setRequestLocale(resolvedLocale);

  if (!isIssueTrackerEnabled()) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  await assertPlatformAdminAccess(resolvedLocale);

  if (!Number.isFinite(number) || number <= 0) {
    notFound();
  }

  const issue = await getIssueByNumber(number);

  if (!issue) {
    notFound();
  }

  const t = await getServerTranslations(resolvedLocale, "issues");

  return (
    <div className="space-y-6">
      <Link
        href={`/${resolvedLocale}/dashboard/admin/issues`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t("admin.title")}
      </Link>

      <AdminIssueDetailPanel issue={issue} locale={resolvedLocale} />
    </div>
  );
}
