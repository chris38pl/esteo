import { setRequestLocale } from "next-intl/server";

import { AdminOpsCasesListPanel } from "@/features/ops-cases/components/admin-ops-cases-list-panel";
import {
  getOpsCaseSummaryCounts,
  listOpsCasesForAdmin,
} from "@/features/ops-cases/server/repository";
import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";

export default async function AdminOpsCasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  const [items, summary] = await Promise.all([
    listOpsCasesForAdmin(),
    getOpsCaseSummaryCounts(),
  ]);

  return <AdminOpsCasesListPanel cases={items} summary={summary} locale={resolvedLocale} />;
}
