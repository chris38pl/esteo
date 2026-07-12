import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { AdminOpsCaseDetailPanel } from "@/features/ops-cases/components/admin-ops-case-detail-panel";
import { createAppMetadata } from "@/features/app/metadata/create-app-metadata";
import { getOpsCaseDocumentTitle } from "@/features/app/metadata/get-entity-document-title";
import { getOpsCaseByNumber } from "@/features/ops-cases/server/repository";
import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; number: string }>;
}): Promise<Metadata> {
  const { locale: localeParam, number: numberParam } = await params;
  const locale = await resolveRequestLocale(localeParam);
  const parsedNumber = Number.parseInt(numberParam, 10);

  if (!Number.isFinite(parsedNumber)) {
    return createAppMetadata({ title: "Esteo" });
  }

  const title = await getOpsCaseDocumentTitle({ number: parsedNumber, locale });
  return createAppMetadata({ title });
}

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
