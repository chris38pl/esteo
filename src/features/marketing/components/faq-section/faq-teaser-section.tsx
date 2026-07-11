import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { MarketingContainer } from "@/features/marketing/components/container";
import { FaqAccordion } from "@/features/marketing/components/faq-section/faq-accordion";
import { MarketingCTA } from "@/features/marketing/components/cta";
import { MarketingSection } from "@/features/marketing/components/section";
import { getFaqContent } from "@/features/marketing/content/faq-content";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import type { Locale } from "@/lib/locale";

export function FaqTeaserSection({ locale }: { locale: Locale }) {
  const content = getFaqContent(locale);

  return (
    <MarketingSection
      id="faq"
      className="dark relative isolate overflow-x-clip border-t border-border/40 bg-background text-foreground"
    >
      <MarketingContainer size="wide" className="space-y-10 sm:space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-pretty text-[38px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-4xl">
            <span className="text-foreground">{content.titleBefore}</span>
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              {content.titleHighlight}
            </span>
          </h2>
          <p className="mx-auto max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-[0.9375rem] sm:leading-7">
            {content.description}
          </p>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12 xl:gap-16">
          <div className="relative hidden justify-center lg:flex lg:justify-start">
            <Image
              src="/images/marketing/faq.webp"
              alt=""
              width={700}
              height={700}
              className="h-auto w-full max-w-[28rem] object-contain xl:max-w-[30rem]"
              sizes="(min-width: 1280px) 30rem, (min-width: 1024px) 28rem, 0px"
            />
          </div>

          <div className="min-w-0 space-y-6">
            <FaqAccordion items={content.teaserItems} page="landing" locale={locale} />

            <MarketingCTA
              href={buildLocalizedPath(locale, "/faq")}
              variant="outline"
              className="h-11 rounded-lg border-border/70 bg-transparent px-5 text-sm font-semibold hover:bg-muted/20"
            >
              {content.cta}
              <ArrowRight className="size-4" />
            </MarketingCTA>
          </div>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}
