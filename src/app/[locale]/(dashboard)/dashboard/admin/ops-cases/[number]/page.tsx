import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { AdminOpsCaseDetailPanel } from "@/features/ops-cases/components/admin-ops-case-detail-panel";
import { getOpsCaseByNumber } from "@/features/ops-cases/server/repository";
import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";

export default async function AdminOpsCaseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; number: string }>;
}) {
  const { locale: localeParam, number: numberParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);
  const number = Number.parseInt(numberParam, 10);

  setRequestLocale(resolvedLocale);

  if (!Number.isFinite(number) || number <= 0) {
    notFound();
  }

  const opsCase = await getOpsCaseByNumber(number);
  if (!opsCase) {
    notFound();
  }

  return <AdminOpsCaseDetailPanel opsCase={opsCase} locale={resolvedLocale} />;
}
