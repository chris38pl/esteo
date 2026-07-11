"use client";

import { ArrowRight, PlayCircle } from "lucide-react";

import type { HeroContent } from "@/features/marketing/components/hero/hero-content";
import { TrackedMarketingCTA } from "@/features/marketing/components/tracked-marketing-cta";
import { useMarketingAuthCta } from "@/features/marketing/lib/use-marketing-auth-cta";
import type { Locale } from "@/lib/locale";

export function HeroCtas({ content, locale }: { content: HeroContent; locale: Locale }) {
  const { resolvePrimaryCta } = useMarketingAuthCta(locale);
  const primaryCta = resolvePrimaryCta(
    {
      href: `/${locale}/sign-up`,
      label: content.primaryCta,
    },
    "openApp",
  );

  return (
    <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
      <TrackedMarketingCTA
        href={primaryCta.href}
        size="lg"
        className="h-11 w-full rounded-lg px-5 text-sm font-semibold shadow-lg shadow-blue-500/20 sm:h-14 sm:px-7 sm:text-base sm:w-auto"
        event="hero_cta_clicked"
        eventProperties={{ locale, page: "landing", cta: "hero_primary", section: "hero" }}
      >
        {primaryCta.label}
        <ArrowRight className="size-4 sm:size-5" />
      </TrackedMarketingCTA>
      <TrackedMarketingCTA
        href="#workflow"
        variant="outline"
        size="lg"
        className="h-11 w-full rounded-lg border-border/70 bg-background/60 px-5 text-sm font-semibold backdrop-blur sm:h-14 sm:px-7 sm:text-base sm:w-auto"
        event="secondary_cta_clicked"
        eventProperties={{ locale, page: "landing", cta: "hero_secondary", section: "hero" }}
      >
        <PlayCircle className="size-4 sm:size-5" />
        {content.secondaryCta}
      </TrackedMarketingCTA>
    </div>
  );
}
