import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import {
  TrustCenterContainer,
  TrustHubGrid,
} from "@/features/marketing/components/trust-center";
import { getTrustHubContent } from "@/features/marketing/content/trust-hub-content";
import { getTrustSharedContent } from "@/features/marketing/content/trust-shared-content";
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
  return createMarketingPageMetadata(locale, "legal");
}

export default async function LegalIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";

  setRequestLocale(locale);

  const hubContent = getTrustHubContent(locale);
  const shared = getTrustSharedContent(locale);

  return (
    <TrustCenterContainer className="space-y-10 sm:space-y-12">
      <div className="mx-auto max-w-3xl text-center">
        <MarketingPageHeader
          title={hubContent.pageTitle}
          description={hubContent.pageDescription}
        />
      </div>

      <TrustHubGrid items={hubContent.cards} ctaLabel={shared.hubCtaLabel} />
    </TrustCenterContainer>
  );
}
