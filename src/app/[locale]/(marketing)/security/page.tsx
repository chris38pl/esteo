import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { SecurityPageContent } from "@/features/marketing/components/security-section";
import { createMarketingPageMetadata } from "@/features/marketing/seo/create-page-metadata";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";
  return createMarketingPageMetadata(locale, "security");
}

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";

  setRequestLocale(locale);

  return <SecurityPageContent locale={locale} />;
}
