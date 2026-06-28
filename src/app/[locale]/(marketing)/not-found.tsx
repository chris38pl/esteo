"use client";

import { useParams } from "next/navigation";

import { MarketingCTA } from "@/features/marketing/components/cta";
import { MarketingContainer } from "@/features/marketing/components/container";
import { MarketingHeading } from "@/features/marketing/components/heading";
import { MarketingSection } from "@/features/marketing/components/section";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import { defaultLocale, isLocale, type Locale } from "@/lib/locale";

function useMarketingLocale(): Locale {
  const params = useParams<{ locale?: string }>();
  return params.locale && isLocale(params.locale) ? params.locale : defaultLocale;
}

export default function MarketingNotFound() {
  const locale = useMarketingLocale();

  return (
    <MarketingSection className="flex min-h-[60dvh] items-center">
      <MarketingContainer size="narrow">
        <MarketingHeading
          eyebrow="404"
          title={locale === "pl" ? "Nie znaleziono strony" : "Page not found"}
          description={
            locale === "pl"
              ? "Ta strona marketingowa nie istnieje albo nie jest jeszcze gotowa."
              : "This marketing page does not exist or is not ready yet."
          }
          align="center"
        />
        <div className="mt-8 flex justify-center">
          <MarketingCTA href={buildLocalizedPath(locale)}>
            {locale === "pl" ? "Wroc na start" : "Back to home"}
          </MarketingCTA>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}
