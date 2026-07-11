import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { FaqPageContent } from "@/features/marketing/components/faq-section";
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
  return createMarketingPageMetadata(locale, "faq");
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";

  setRequestLocale(locale);

  return <FaqPageContent locale={locale} />;
}
