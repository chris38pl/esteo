import { ArrowRight, CreditCard, FolderOpen, Shield, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { MarketingContainer } from "@/features/marketing/components/container";
import { MarketingCTA } from "@/features/marketing/components/cta";
import { MarketingSection } from "@/features/marketing/components/section";
import { getSecurityBandContent } from "@/features/marketing/content/security-content";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const pointIcons: Record<string, LucideIcon> = {
  auth: Shield,
  billing: CreditCard,
  workspace: FolderOpen,
  ai: Sparkles,
};

function SecurityTrustIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-lg sm:size-11",
        "bg-[radial-gradient(circle_at_50%_32%,rgba(59,130,246,0.28),rgba(30,64,175,0.1)_58%,rgba(15,23,42,0.24)_100%)]",
        "shadow-[0_0_18px_-14px_rgba(59,130,246,0.35)]",
      )}
    >
      <Icon className="size-[1.125rem] text-primary sm:size-5" strokeWidth={1.5} aria-hidden />
    </span>
  );
}

export function SecurityTrustSection({ locale }: { locale: Locale }) {
  const content = getSecurityBandContent(locale);

  return (
    <MarketingSection className="dark relative isolate overflow-x-clip border-t border-border/40 bg-background text-foreground">
      <MarketingContainer size="wide" className="space-y-10 py-4 sm:space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-pretty text-[38px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-4xl">
            <span className="text-foreground">{content.titleBefore}</span>
            <span className="text-primary">{content.titleHighlight}</span>
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-sm leading-6 text-muted-foreground sm:text-[0.9375rem] sm:leading-7">
            {content.description}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {content.points.map((point) => {
            const Icon = pointIcons[point.id] ?? Shield;

            return (
              <article
                key={point.id}
                className={cn(
                  "flex h-full flex-col rounded-xl border border-border/45 bg-card/35 p-6",
                  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
                )}
              >
                <SecurityTrustIcon Icon={Icon} />
                <h3 className="mt-4 text-sm font-semibold leading-snug text-foreground sm:text-[0.9375rem]">
                  {point.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-[13px] sm:leading-6">
                  {point.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="flex flex-col items-center justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground sm:justify-start">
            <Link
              href={buildLocalizedPath(locale, "/legal/privacy")}
              className="transition hover:text-foreground"
            >
              {content.privacyLink}
            </Link>
            <span aria-hidden className="text-border/80">
              •
            </span>
            <Link
              href={buildLocalizedPath(locale, "/legal/ai")}
              className="transition hover:text-foreground"
            >
              {content.aiLink}
            </Link>
          </div>

          <MarketingCTA
            href={buildLocalizedPath(locale, "/security")}
            className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-600/90 sm:h-12 sm:px-6"
          >
            {content.cta}
            <ArrowRight className="size-4" />
          </MarketingCTA>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}
