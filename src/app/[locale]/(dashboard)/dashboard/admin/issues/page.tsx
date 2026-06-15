import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { AdminIssuesListPanel } from "@/features/issues/components/admin-issues-list-panel";
import { listIssuesForAdmin } from "@/features/issues/server/repository";
import { resolveRequestLocale } from "@/i18n/request-locale";
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
  const items = await listIssuesForAdmin();

  return <AdminIssuesListPanel issues={items} locale={resolvedLocale} />;
}
