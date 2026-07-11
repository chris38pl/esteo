import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { PricingSection } from "@/features/marketing/components/pricing-section";
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
  return createMarketingPageMetadata(locale, "pricing");
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";

  setRequestLocale(locale);

  return <PricingSection locale={locale} analyticsSource="pricing" />;
}
