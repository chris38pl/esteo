import type { Locale } from "@/lib/locale";
import { MarketingContainer } from "@/features/marketing/components/container";
import { MarketingSection } from "@/features/marketing/components/section";
import { heroContent } from "@/features/marketing/components/hero/hero-content";
import { HeroContentPanel } from "@/features/marketing/components/hero/hero-content-panel";
import { HeroFeatures } from "@/features/marketing/components/hero/hero-features";
import { HeroPhone } from "@/features/marketing/components/hero/hero-phone";
import { HeroIndustriesSection } from "@/features/marketing/components/hero/hero-industries-section";

export function HeroSection({ locale }: { locale: Locale }) {
  const content = heroContent[locale];

  return (
    <MarketingSection className="dark relative isolate overflow-x-hidden bg-background pb-14 pt-10 text-foreground sm:pb-20 sm:pt-16 lg:overflow-x-visible lg:pb-24 lg:pt-20">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 -z-10 hidden h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-400/10 lg:block"
      />
      <div
        aria-hidden
        className="absolute right-0 top-32 -z-10 hidden h-[34rem] w-[34rem] rounded-full bg-violet-500/10 blur-3xl lg:block"
      />

      <MarketingContainer size="wide">
        <div className="relative">
          <HeroContentPanel content={content} locale={locale} />

          <div className="relative mt-12 sm:mt-14 lg:mt-[15px]">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-6 -z-10 h-[38rem] w-[min(100vw,26rem)] -translate-x-1/2 rounded-full bg-blue-500/[0.06] blur-3xl dark:bg-blue-400/[0.08] lg:hidden"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 top-32 -z-10 h-64 w-64 rounded-full bg-violet-500/[0.05] blur-3xl lg:hidden"
            />
            <div className="translate-y-[25px] sm:translate-y-[33px] lg:translate-y-[30px] lg:absolute lg:right-[calc(5rem+3.25rem)] lg:bottom-0 lg:z-[5] lg:h-[48.5rem] lg:w-[63%] xl:right-[calc(6rem+3.25rem)] xl:h-[52rem] xl:w-[61%]">
              <HeroPhone locale={locale} />
            </div>
            <div className="relative z-30 -mt-[81px] sm:-mt-[97px] lg:mt-[30px]">
              <HeroFeatures features={content.features} />
            </div>
          </div>

          <div className="relative z-20 mt-20 sm:mt-28 lg:mt-[calc(9rem-10px)] xl:mt-[calc(11rem-10px)]">
            <HeroIndustriesSection locale={locale} />
          </div>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}
