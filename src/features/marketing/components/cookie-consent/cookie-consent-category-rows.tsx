import { Lock, LineChart } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import type { CookieConsentContent } from "@/features/marketing/content/cookie-consent-content";
import { cn } from "@/lib/utils";

type CookieConsentCategoryRowsProps = {
  content: CookieConsentContent;
  analyticsEnabled: boolean;
  onAnalyticsChange: (value: boolean) => void;
};

export function CookieConsentCategoryRows({
  content,
  analyticsEnabled,
  onAnalyticsChange,
}: CookieConsentCategoryRowsProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/45 bg-card/30">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Lock className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{content.categoryNecessaryTitle}</p>
          <p className="text-xs text-muted-foreground">{content.categoryNecessarySubtitle}</p>
        </div>
        <Lock className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
      </div>

      <div className="border-t border-border/45" />

      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LineChart className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{content.categoryAnalyticsTitle}</p>
          <p className="text-xs text-muted-foreground">{content.categoryAnalyticsSubtitle}</p>
        </div>
        <Switch
          checked={analyticsEnabled}
          onCheckedChange={onAnalyticsChange}
          aria-label={content.analyticsSwitchLabel}
        />
      </div>
    </div>
  );
}

export function CookieConsentIcon({
  className,
  size = "default",
}: {
  className?: string;
  size?: "default" | "banner";
}) {
  if (size === "banner") {
    return (
      <div
        className={cn(
          "flex size-[4.5rem] shrink-0 items-center justify-center rounded-full bg-card/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] md:size-20",
          className,
        )}
      >
        <span className="text-[2.75rem] leading-none select-none md:text-5xl" role="img" aria-label="Cookies">
          🍪
        </span>
      </div>
    );
  }

  return (
    <span className={cn("text-2xl leading-none", className)} role="img" aria-label="Cookies">
      🍪
    </span>
  );
}
