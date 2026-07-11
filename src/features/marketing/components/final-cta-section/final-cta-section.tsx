"use client";

import { ArrowRight, CreditCard, Sparkles, Tag } from "lucide-react";
import Image from "next/image";

import { MarketingContainer } from "@/features/marketing/components/container";
import { TrackedMarketingCTA } from "@/features/marketing/components/tracked-marketing-cta";
import { MarketingSection } from "@/features/marketing/components/section";
import {
  FINAL_CTA_IMAGE_PATH,
  finalCtaContent,
  type FinalCtaTrustItem,
} from "@/features/marketing/content/final-cta-content";
import { useMarketingAuthCta } from "@/features/marketing/lib/use-marketing-auth-cta";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const trustIcons: Record<FinalCtaTrustItem["id"], typeof Tag> = {
  free_plan: Tag,
  no_commitment: CreditCard,
  ai_calls: Sparkles,
};

function FinalCtaTrustList({
  items,
  className,
}: {
  items: FinalCtaTrustItem[];
  className?: string;
}) {
  return (
    <ul className={cn("text-xs text-muted-foreground sm:text-[13px]", className)}>
      {items.map((item, index) => {
        const Icon = trustIcons[item.id] ?? Tag;

        return (
          <li key={item.id} className="flex items-center gap-2.5">
            {index > 0 ? (
              <span
                aria-hidden
                className="mx-1 hidden text-border/80 lg:inline"
              >
                •
              </span>
            ) : null}
            <Icon className="size-3.5 shrink-0 text-primary/80" strokeWidth={2} aria-hidden />
            <span>{item.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function FinalCtaSection({ locale }: { locale: Locale }) {
  const content = finalCtaContent[locale];
  const { resolvePrimaryCta } = useMarketingAuthCta(locale);

  const primaryCta = resolvePrimaryCta(
    {
      href: `/${locale}/sign-up`,
      label: content.cta,
    },
    "goToApp",
  );

  const ctaButton = (
    <TrackedMarketingCTA
      href={primaryCta.href}
      size="lg"
      className="h-12 w-full rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-600/90 sm:h-[3.25rem] lg:w-auto lg:min-w-[15rem] lg:text-base"
      event="hero_cta_clicked"
      eventProperties={{ locale, page: "landing", cta: "final_cta", section: "final_cta" }}
    >
      {primaryCta.label}
      <ArrowRight className="size-4 sm:size-5" />
    </TrackedMarketingCTA>
  );

  return (
    <MarketingSection className="dark relative overflow-visible border-t border-border/40 bg-background py-14 text-foreground sm:py-16 lg:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute z-0 hidden size-[18rem] rounded-full bg-blue-500/[0.11] blur-[120px] lg:block lg:left-[11%] lg:top-[26%] xl:left-[13%]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute z-0 hidden size-[14rem] rounded-full bg-violet-500/[0.06] blur-[100px] lg:block lg:left-[22%] lg:top-[32%] xl:left-[24%]"
      />

      <MarketingContainer size="wide" className="relative z-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center lg:gap-4 xl:gap-8">
          <div className="order-1 mx-auto max-w-xl space-y-4 text-center lg:col-start-1 lg:row-start-1 lg:mx-0 lg:py-4 lg:text-left">
            <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              {content.eyebrow}
            </p>

            <div className="space-y-4">
              <h2 className="text-pretty text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[2.375rem] sm:leading-[1.1] lg:text-[2.5rem]">
                <span className="text-foreground">{content.titleBefore}</span>
                <span className="text-primary">{content.titleHighlight}</span>
              </h2>
              <p className="mx-auto max-w-md text-pretty text-sm leading-6 text-muted-foreground sm:text-[0.9375rem] sm:leading-7 lg:mx-0">
                {content.description}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "order-2 relative flex justify-center",
              "lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:justify-end",
            )}
          >
            <div className="pointer-events-none relative w-full max-w-[24rem] sm:max-w-[28rem] lg:max-w-[30rem]">
              <Image
                src={FINAL_CTA_IMAGE_PATH}
                alt=""
                width={800}
                height={800}
                className="relative z-10 h-auto w-full object-contain"
                sizes="(min-width: 1280px) 30rem, (min-width: 1024px) 28rem, (min-width: 640px) 28rem, 24rem"
              />
            </div>
          </div>

          <div className="order-3 lg:col-start-1 lg:row-start-2">{ctaButton}</div>

          <FinalCtaTrustList
            items={content.trustItems}
            className="order-4 flex flex-col items-center gap-3 lg:col-start-1 lg:row-start-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-2"
          />
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}
