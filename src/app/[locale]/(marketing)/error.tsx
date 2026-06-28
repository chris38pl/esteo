"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
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

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useMarketingLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <MarketingSection className="flex min-h-[60dvh] items-center">
      <MarketingContainer size="narrow">
        <MarketingHeading
          eyebrow="500"
          title={locale === "pl" ? "Cos poszlo nie tak" : "Something went wrong"}
          description={
            locale === "pl"
              ? "Nie udalo sie zaladowac tej strony marketingowej. Sprobuj ponownie albo wroc na strone glowna."
              : "This marketing page could not be loaded. Try again or return to the homepage."
          }
          align="center"
        />
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" variant="outline" onClick={reset}>
            {locale === "pl" ? "Sprobuj ponownie" : "Try again"}
          </Button>
          <MarketingCTA href={buildLocalizedPath(locale)}>
            {locale === "pl" ? "Wroc na start" : "Back to home"}
          </MarketingCTA>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}
