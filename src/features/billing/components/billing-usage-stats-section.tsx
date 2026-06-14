"use client";

import type { LucideIcon } from "lucide-react";
import { Brain, Database, FileText, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import type { WorkspaceBillingPageData } from "@/features/billing/billing-page-data";
import { cn } from "@/lib/utils";

type UsageTheme = "purple" | "green" | "orange";

const themeStyles: Record<
  UsageTheme,
  {
    iconBox: string;
    icon: string;
    bar: string;
  }
> = {
  purple: {
    iconBox: "border-violet-500/25 bg-violet-500/10",
    icon: "text-violet-400",
    bar: "bg-violet-500",
  },
  green: {
    iconBox: "border-emerald-500/25 bg-emerald-500/10",
    icon: "text-emerald-400",
    bar: "bg-emerald-500",
  },
  orange: {
    iconBox: "border-orange-500/25 bg-orange-500/10",
    icon: "text-orange-400",
    bar: "bg-orange-500",
  },
};

type UsageCardConfig = {
  id: string;
  label: string;
  value: string;
  caption: string;
  progressPercent: number;
  theme: UsageTheme;
  icon: LucideIcon;
};

function formatUsageValue(used: number, limit: number | null, unlimitedLabel: string): string {
  if (limit === null) {
    return `${used} / ${unlimitedLabel}`;
  }
  return `${used} / ${limit}`;
}

function usageProgressPercent(used: number, limit: number | null): number {
  if (limit === null || limit <= 0) {
    return used > 0 ? 8 : 0;
  }
  return Math.min(100, Math.round((used / limit) * 100));
}

export function BillingUsageStatsSection({ data }: { data: WorkspaceBillingPageData }) {
  const t = useTranslations("billing.workspace.usage");
  const { entitlements, storage } = data;
  const seatsUsed = entitlements.seats.used + entitlements.seats.reserved;
  const seatsLimit = entitlements.seats.limit;
  const seatsPercent = usageProgressPercent(seatsUsed, seatsLimit);
  const storagePercent = Math.round(storage.usedPercent);

  const cards: UsageCardConfig[] = [
    {
      id: "ai",
      label: t("aiUsage"),
      value: formatUsageValue(
        entitlements.usage.aiCallsThisMonth,
        entitlements.limits.maxAiAssistantCallsPerMonth,
        t("unlimited"),
      ),
      caption: t("usedThisMonth"),
      progressPercent: usageProgressPercent(
        entitlements.usage.aiCallsThisMonth,
        entitlements.limits.maxAiAssistantCallsPerMonth,
      ),
      theme: "purple",
      icon: Brain,
    },
    {
      id: "estimates",
      label: t("estimates"),
      value: formatUsageValue(
        entitlements.usage.estimatesThisMonth,
        entitlements.limits.maxEstimatesPerMonth,
        t("unlimited"),
      ),
      caption: t("usedThisMonth"),
      progressPercent: usageProgressPercent(
        entitlements.usage.estimatesThisMonth,
        entitlements.limits.maxEstimatesPerMonth,
      ),
      theme: "purple",
      icon: FileText,
    },
    {
      id: "users",
      label: t("users"),
      value: formatUsageValue(seatsUsed, seatsLimit, t("unlimited")),
      caption:
        seatsLimit === null ? t("usedThisMonth") : t("percentUsed", { percent: seatsPercent }),
      progressPercent: seatsPercent,
      theme: "green",
      icon: Users,
    },
    {
      id: "storage",
      label: t("storage"),
      value: `${storage.usedFormatted} / ${storage.limitFormatted}`,
      caption: t("percentUsed", { percent: storagePercent }),
      progressPercent: Math.min(100, storagePercent),
      theme: "orange",
      icon: Database,
    },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <BillingUsageStatCard
            key={card.id}
            label={card.label}
            value={card.value}
            caption={card.caption}
            progressPercent={card.progressPercent}
            theme={card.theme}
            icon={card.icon}
            className={cn(
              "border-border/60",
              index < cards.length - 1 && "border-b",
              index % 2 === 0 && index < cards.length - 1 && "sm:border-r",
              (index === 0 || index === 1) && "sm:border-b",
              index >= 2 && "sm:border-b-0",
              "xl:border-b-0",
              index < cards.length - 1 && "xl:border-r",
            )}
          />
        ))}
      </div>
    </section>
  );
}

function BillingUsageStatCard({
  label,
  value,
  caption,
  progressPercent,
  theme,
  icon: Icon,
  className,
}: Omit<UsageCardConfig, "id"> & { className?: string }) {
  const styles = themeStyles[theme];

  return (
    <div className={cn("flex min-w-0 flex-col gap-4 p-5 sm:p-6", className)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg border",
            styles.iconBox,
          )}
        >
          <Icon className={cn("size-5", styles.icon)} aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-semibold tracking-tight">{value}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted/80">
          <div
            className={cn("h-full rounded-full transition-[width] duration-500", styles.bar)}
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
          />
        </div>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </div>
    </div>
  );
}
