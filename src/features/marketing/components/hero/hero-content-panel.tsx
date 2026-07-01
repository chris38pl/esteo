import { ArrowRight, PlayCircle, Sparkles, Star } from "lucide-react";

import { MarketingCTA } from "@/features/marketing/components/cta";
import type { HeroContent } from "@/features/marketing/components/hero/hero-content";
import type { Locale } from "@/lib/locale";

export function HeroContentPanel({
  content,
  locale,
}: {
  content: HeroContent;
  locale: Locale;
}) {
  return (
    <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center justify-start space-y-6 text-center sm:space-y-7 lg:mx-0 lg:max-w-lg lg:items-start lg:py-0 lg:text-left">
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Sparkles className="size-3 text-primary" />
        {content.badge}
      </div>

      <div className="space-y-4">
        <h1 className="text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-5xl sm:leading-[1.06] lg:text-[3.25rem] lg:leading-[1.05]">
          <span className="block">{content.headlineLines[0]}</span>
          <span className="block">{content.headlineLines[1]}</span>
          <span className="block text-primary">{content.highlight}</span>
        </h1>
        <p className="mx-auto max-w-md text-pretty text-sm font-normal leading-6 text-muted-foreground sm:text-[0.9375rem] sm:leading-7 lg:mx-0">
          {content.description}
        </p>
      </div>

      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
        <MarketingCTA
          href={`/${locale}/sign-up`}
          size="lg"
          className="h-11 w-full rounded-lg px-5 text-sm font-semibold shadow-lg shadow-blue-500/20 sm:h-14 sm:px-7 sm:text-base sm:w-auto"
        >
          {content.primaryCta}
          <ArrowRight className="size-4 sm:size-5" />
        </MarketingCTA>
        <MarketingCTA
          href="#workflow"
          variant="outline"
          size="lg"
          className="h-11 w-full rounded-lg border-border/70 bg-background/60 px-5 text-sm font-semibold backdrop-blur sm:h-14 sm:px-7 sm:text-base sm:w-auto"
        >
          <PlayCircle className="size-4 sm:size-5" />
          {content.secondaryCta}
        </MarketingCTA>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
        <div className="flex -space-x-3">
          <div
            className="relative z-10 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-card shadow-sm"
            style={{ zIndex: 10 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.partnerLogo.src}
              alt={content.partnerLogo.alt}
              width={40}
              height={40}
              className="size-full object-cover"
            />
          </div>
          {["M", "K", "P"].map((initial, index) => (
            <div
              key={initial}
              className="flex size-10 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-blue-500/80 to-violet-500/80 text-xs font-bold text-white shadow-sm"
              style={{ zIndex: 9 - index }}
            >
              {initial}
            </div>
          ))}
        </div>
        <div className="text-center sm:text-left">
          <div className="flex justify-center gap-0.5 text-amber-400 sm:justify-start">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="size-3.5 fill-current" />
            ))}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{content.socialProof}</p>
        </div>
      </div>
    </div>
  );
}
