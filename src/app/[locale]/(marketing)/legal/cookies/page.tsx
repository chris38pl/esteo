import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { TrustCenterContainer } from "@/features/marketing/components/trust-center";
import { LegalDocument } from "@/features/marketing/components/legal-document";
import { TrustBreadcrumbJsonLd } from "@/features/marketing/components/trust-center";
import { cookiesContent } from "@/features/marketing/content/legal-content";
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
  return createMarketingPageMetadata(locale, "cookies");
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";

  setRequestLocale(locale);

  const content = cookiesContent[locale];
  const shared = getTrustSharedContent(locale);

  return (
    <>
      <TrustBreadcrumbJsonLd
        locale={locale}
        items={[
          { name: shared.securityCenterLabel, path: "/legal" },
          { name: content.breadcrumbLabel, path: "/legal/cookies" },
        ]}
      />
      <TrustCenterContainer>
        <LegalDocument content={content} locale={locale} />
      </TrustCenterContainer>
    </>
  );
}
