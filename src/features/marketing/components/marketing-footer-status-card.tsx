import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getOverallStatusMessage } from "@/features/marketing/content/status-content";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const statusDotClass = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  outage: "bg-red-500",
  maintenance: "bg-sky-500",
} as const;

export function MarketingFooterStatusCard({ locale }: { locale: Locale }) {
  const overall = getOverallStatusMessage(locale);
  const title = locale === "pl" ? "Status systemu" : "System status";
  const ctaLabel = locale === "pl" ? "Sprawdź status" : "Check status";

  return (
    <div className="rounded-xl border border-border/45 bg-card/35 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={cn("size-2.5 shrink-0 rounded-full", statusDotClass[overall.status])}
            aria-hidden
          />
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{overall.message}</p>
      </div>

      <Link
        href={buildLocalizedPath(locale, "/status")}
        className={cn(
          "mt-4 inline-flex h-10 w-full items-center justify-center gap-1 rounded-lg border border-primary/60",
          "text-sm font-medium text-primary transition hover:bg-primary/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
        )}
      >
        {ctaLabel}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
