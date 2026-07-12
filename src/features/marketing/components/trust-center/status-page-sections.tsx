import Link from "next/link";
import type { ReactNode } from "react";
import {
  ChevronRight,
  CloudUpload,
  CreditCard,
  Hexagon,
  Shield,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { ComponentStatus } from "@/features/marketing/content/status.config";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import { StatusUptimeSparkline } from "./status-uptime-sparkline";

const statusDotClass: Record<ComponentStatus, string> = {
  operational: "bg-emerald-400",
  degraded: "bg-amber-400",
  outage: "bg-red-400",
  maintenance: "bg-sky-400",
};

const statusTextClass: Record<ComponentStatus, string> = {
  operational: "text-emerald-400",
  degraded: "text-amber-400",
  outage: "text-red-400",
  maintenance: "text-sky-400",
};

const componentIcons: Record<string, LucideIcon> = {
  app: Smartphone,
  ai: Sparkles,
  auth: Shield,
  payments: CreditCard,
  files: CloudUpload,
  api: Hexagon,
};

type StatusHeroProps = {
  overallStatus: ComponentStatus;
  overallLabel: string;
  overallMessage: string;
  lastUpdated: string;
  availabilityValue: string;
  availabilityLabel: string;
};

export function StatusPageHero({
  overallStatus,
  overallLabel,
  overallMessage,
  lastUpdated,
  availabilityValue,
  availabilityLabel,
}: StatusHeroProps) {
  return (
    <section className="rounded-2xl border border-border/45 bg-card/35 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] sm:p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-5 sm:gap-6">
          <span
            className={cn("size-14 shrink-0 rounded-full sm:size-16", statusDotClass[overallStatus])}
            aria-hidden
          />
          <div className="min-w-0 space-y-2.5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {overallLabel}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">{overallMessage}</p>
            <p className="text-xs text-muted-foreground sm:text-sm">{lastUpdated}</p>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 lg:max-w-sm lg:items-end">
          <div className="lg:text-right">
            <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {availabilityValue}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{availabilityLabel}</p>
          </div>
          <StatusUptimeSparkline className="lg:max-w-[18rem]" />
        </div>
      </div>
    </section>
  );
}

type StatusComponentItem = {
  id: string;
  name: string;
  status: ComponentStatus;
  statusLabel: string;
};

type StatusComponentsGridProps = {
  heading: string;
  legend: { operational: string; degraded: string; outage: string };
  components: StatusComponentItem[];
};

function StatusComponentCard({
  id,
  name,
  status,
  statusLabel,
}: StatusComponentItem) {
  const Icon = componentIcons[id] ?? Shield;

  return (
    <article className="flex items-center gap-4 rounded-2xl border border-border/45 bg-card/35 px-5 py-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] sm:px-6 sm:py-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border/35 bg-muted/15 sm:size-12">
        <Icon className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      </span>

      <div className="min-w-0 flex-1 space-y-1.5">
        <h3 className="text-sm font-semibold text-foreground sm:text-base">{name}</h3>
        <p className={cn("inline-flex items-center gap-2 text-sm", statusTextClass[status])}>
          <span className={cn("size-2 shrink-0 rounded-full", statusDotClass[status])} aria-hidden />
          {statusLabel}
        </p>
      </div>

      <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
    </article>
  );
}

export function StatusComponentsGrid({ heading, legend, components }: StatusComponentsGridProps) {
  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">{heading}</h2>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground sm:text-sm">
          <li className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400" aria-hidden />
            {legend.operational}
          </li>
          <li className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-amber-400" aria-hidden />
            {legend.degraded}
          </li>
          <li className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-red-400" aria-hidden />
            {legend.outage}
          </li>
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        {components.map((component) => (
          <StatusComponentCard key={component.id} {...component} />
        ))}
      </div>
    </section>
  );
}

type StatusInfoCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
};

function StatusInfoCard({ icon: Icon, title, description, children }: StatusInfoCardProps) {
  return (
    <article className="rounded-2xl border border-border/45 bg-card/35 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] sm:p-7">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-border/35 bg-muted/15">
          <Icon className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 space-y-2">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {children ?? <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
      </div>
    </article>
  );
}

type StatusBottomSectionsProps = {
  maintenanceHeading: string;
  maintenanceEmpty: string;
  maintenanceItems: {
    id: string;
    title: string;
    description?: string;
    schedule: string;
  }[];
  incidentsHeading: string;
  incidentsEmpty: string;
  incidents: {
    id: string;
    title: string;
    description: string;
    occurredAt: string;
    resolvedAt?: string;
  }[];
  resolvedLabel: string;
};

export function StatusBottomSections({
  maintenanceHeading,
  maintenanceEmpty,
  maintenanceItems,
  incidentsHeading,
  incidentsEmpty,
  incidents,
  resolvedLabel,
}: StatusBottomSectionsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 sm:gap-5">
      <StatusInfoCard icon={Wrench} title={maintenanceHeading} description={maintenanceEmpty}>
        {maintenanceItems.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">{maintenanceEmpty}</p>
        ) : (
          <ul className="space-y-4">
            {maintenanceItems.map((item) => (
              <li key={item.id} className="space-y-1 text-sm leading-6 text-muted-foreground">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="whitespace-pre-line">{item.schedule}</p>
                {item.description ? <p>{item.description}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </StatusInfoCard>

      <StatusInfoCard icon={ShieldAlert} title={incidentsHeading} description={incidentsEmpty}>
        {incidents.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">{incidentsEmpty}</p>
        ) : (
          <ul className="space-y-4">
            {incidents.map((incident) => (
              <li key={incident.id} className="space-y-1 text-sm leading-6 text-muted-foreground">
                <p className="font-medium text-foreground">{incident.title}</p>
                <p className="text-xs">{incident.occurredAt}</p>
                <p>{incident.description}</p>
                {incident.resolvedAt ? (
                  <p className="text-xs">
                    {resolvedLabel}: {incident.resolvedAt}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </StatusInfoCard>
    </section>
  );
}

type StatusContactFooterProps = {
  locale: Locale;
  text: string;
  ctaLabel: string;
};

export function StatusContactFooter({ locale, text, ctaLabel }: StatusContactFooterProps) {
  return (
    <section className="flex flex-col gap-4 border-t border-border/35 pt-8 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link
        href={buildLocalizedPath(locale, "/contact")}
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-xl border border-primary/45 px-6",
          "text-sm font-medium text-primary transition hover:bg-primary/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
        )}
      >
        {ctaLabel}
      </Link>
    </section>
  );
}
