import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import { isLocale, type Locale } from "@/lib/locale";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  setRequestLocale(locale);

  return <MarketingShell locale={locale}>{children}</MarketingShell>;
}
