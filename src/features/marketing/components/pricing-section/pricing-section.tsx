import { MarketingContainer } from "@/features/marketing/components/container";
import { PricingCards } from "@/features/marketing/components/pricing-section/pricing-cards";
import { getPricingContent } from "@/features/marketing/components/pricing-section/pricing-data";
import { PricingTrust } from "@/features/marketing/components/pricing-section/pricing-trust";
import { MarketingSection } from "@/features/marketing/components/section";
import type { Locale } from "@/lib/locale";

export function PricingSection({ locale }: { locale: Locale }) {
  const content = getPricingContent(locale);

  return (
    <MarketingSection
      id="pricing"
      className="dark relative isolate overflow-x-clip border-t border-border/40 bg-background pt-20 pb-16 text-foreground sm:pt-28 sm:pb-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[32rem] w-[min(100vw,52rem)] -translate-x-1/2 rounded-full bg-blue-500/[0.06] blur-3xl dark:bg-blue-400/[0.07]"
      />

      <MarketingContainer size="wide" className="space-y-12 sm:space-y-14">
        <div className="mx-auto max-w-3xl space-y-5 text-center">
          <p className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
            {content.eyebrow}
          </p>

          <h2 className="text-pretty text-[38px] font-semibold leading-[1.1] tracking-[-0.03em]">
            <span className="text-foreground">{content.titleBefore}</span>
            <span className="text-primary">{content.titleHighlight}</span>
          </h2>

          <p className="mx-auto max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-[0.9375rem] sm:leading-7">
            {content.description}
          </p>
        </div>

        <PricingCards content={content} locale={locale} />

        <PricingTrust content={content} />
      </MarketingContainer>
    </MarketingSection>
  );
}
