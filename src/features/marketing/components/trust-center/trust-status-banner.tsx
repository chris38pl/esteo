import Link from "next/link";
import { Activity, ArrowRight, Clock, Globe, ShieldCheck, type LucideIcon } from "lucide-react";

import { getStatusBannerContent } from "@/features/marketing/content/status-content";
import type { ComponentStatus } from "@/features/marketing/content/status.config";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const statusDotClass: Record<ComponentStatus, string> = {
  operational: "bg-emerald-400",
  degraded: "bg-amber-400",
  outage: "bg-red-400",
  maintenance: "bg-sky-400",
};

const statusAccentClass: Record<ComponentStatus, string> = {
  operational: "text-emerald-400",
  degraded: "text-amber-400",
  outage: "text-red-400",
  maintenance: "text-sky-400",
};

type TrustStatusBannerProps = {
  locale: Locale;
  className?: string;
};

type BannerStatProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  valueClassName?: string;
};

function BannerStat({ icon: Icon, label, value, sub, valueClassName }: BannerStatProps) {
  return (
    <div className="flex min-w-[9.5rem] flex-1 items-center gap-3.5 px-5 py-7 sm:px-6 sm:py-8">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border/35 bg-muted/15">
        <Icon className="size-[1.125rem] text-muted-foreground" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 space-y-1.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-lg font-semibold leading-tight tracking-tight", valueClassName)}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

export function TrustStatusBanner({ locale, className }: TrustStatusBannerProps) {
  const content = getStatusBannerContent(locale);
  const accentClass = statusAccentClass[content.overallStatus];

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/45 bg-card/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
        className,
      )}
    >
      <div className="flex flex-col xl:flex-row xl:items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-5 px-6 py-7 sm:gap-6 sm:px-7 sm:py-8 xl:max-w-[24rem]">
          <ShieldCheck
            className="size-12 shrink-0 text-emerald-400 sm:size-14"
            strokeWidth={1.5}
            aria-hidden
          />

          <div className="min-w-0 space-y-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className={cn("size-2 shrink-0 rounded-full", statusDotClass[content.overallStatus])}
                aria-hidden
              />
              {content.shortStatusMessage}
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {content.title}
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{content.lastUpdatedShort}</p>
          </div>
        </div>

        <div className="hidden w-px bg-border/35 xl:block" aria-hidden />

        <div className="flex min-w-0 flex-1 flex-col border-t border-border/35 sm:flex-row sm:items-stretch xl:border-t-0">
          <BannerStat
            icon={Globe}
            label={content.availability.label}
            value={content.availability.value}
            sub={content.availability.sub}
            valueClassName={accentClass}
          />

          <div className="hidden w-px bg-border/35 sm:block" aria-hidden />
          <div className="h-px bg-border/35 sm:hidden" aria-hidden />

          <BannerStat
            icon={Clock}
            label={content.lastIncident.label}
            value={content.lastIncident.value}
            sub={content.lastIncident.sub}
            valueClassName="text-foreground"
          />

          <div className="hidden w-px bg-border/35 sm:block" aria-hidden />
          <div className="h-px bg-border/35 sm:hidden" aria-hidden />

          <BannerStat
            icon={Activity}
            label={content.monitoring.label}
            value={content.monitoring.value}
            sub={content.monitoring.sub}
            valueClassName={accentClass}
          />
        </div>

        <div className="hidden w-px bg-border/35 xl:block" aria-hidden />

        <div className="flex items-center border-t border-border/35 px-6 py-7 sm:px-7 sm:py-8 xl:border-t-0 xl:border-l-0">
          <Link
            href={buildLocalizedPath(locale, "/status")}
            className={cn(
              "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/45 px-5",
              "text-sm font-medium text-primary transition hover:bg-primary/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
              "xl:w-auto xl:whitespace-nowrap",
            )}
          >
            {content.ctaLabel}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
