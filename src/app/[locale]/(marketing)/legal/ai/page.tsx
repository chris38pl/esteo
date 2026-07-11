import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { MarketingContainer } from "@/features/marketing/components/container";
import { LegalDocument } from "@/features/marketing/components/legal-document";
import { aiDisclaimerContent } from "@/features/marketing/content/legal-content";
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
  return createMarketingPageMetadata(locale, "ai");
}

export default async function AiDisclaimerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";

  setRequestLocale(locale);

  return (
    <MarketingContainer size="narrow" className="py-14 sm:py-20">
      <LegalDocument content={aiDisclaimerContent[locale]} />
    </MarketingContainer>
  );
}
