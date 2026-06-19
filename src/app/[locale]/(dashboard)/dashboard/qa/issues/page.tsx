import { setRequestLocale } from "next-intl/server";

import { AdminIssuesListPanel } from "@/features/issues/components/admin-issues-list-panel";
import { listIssuesForAdmin } from "@/features/issues/server/repository";
import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";

export default async function QaIssuesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  const items = await listIssuesForAdmin();

  return <AdminIssuesListPanel issues={items} locale={resolvedLocale} issuesVariant="qa" />;
}
