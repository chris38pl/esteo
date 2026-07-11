import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { MarketingContainer } from "@/features/marketing/components/container";
import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import { getMarketingLegalNavigation } from "@/features/marketing/lib/navigation";
import { createMarketingPageMetadata } from "@/features/marketing/seo/create-page-metadata";
import { marketingPageSeo } from "@/features/marketing/seo/page-seo";
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

  const seo = marketingPageSeo.legal[locale];
  const legalNavigation = getMarketingLegalNavigation(locale).filter((item) => item.id !== "legal");

  return (
    <MarketingContainer size="narrow" className="space-y-8 py-14 sm:py-20">
      <MarketingPageHeader title={seo.title} description={seo.description} />
      <ul className="space-y-3">
        {legalNavigation.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="text-sm font-medium text-primary transition hover:underline"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        <Link href={buildLocalizedPath(locale, "/legal/privacy")} className="text-primary hover:underline">
          {locale === "pl" ? "Przejdź do Polityki prywatności" : "Go to Privacy Policy"}
        </Link>
      </p>
    </MarketingContainer>
  );
}
