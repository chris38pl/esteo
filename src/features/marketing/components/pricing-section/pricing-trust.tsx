import { Ban, Building2, Lock, Shield, type LucideIcon } from "lucide-react";

import type { PricingContent } from "@/features/marketing/components/pricing-section/pricing-data";
import { cn } from "@/lib/utils";

const trustIcons: LucideIcon[] = [Shield, Ban, Building2];

function TrustIcon({ Icon }: { Icon: LucideIcon }) {
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

export function PricingTrust({ content }: { content: PricingContent }) {
  return (
    <div className="space-y-8 sm:space-y-10">
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border/45 bg-card/35",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          {content.trust.map((item, index) => {
            const Icon = trustIcons[index] ?? Shield;

            return (
              <div
                key={item.title}
                className={cn(
                  "relative flex min-w-0 flex-1 items-center gap-3.5 px-5 py-5 sm:gap-4 sm:px-6 sm:py-6 lg:px-7",
                  index > 0 && "border-t border-border/40 sm:border-t-0",
                  index > 0 &&
                    "sm:before:absolute sm:before:top-1/2 sm:before:left-0 sm:before:h-[68%] sm:before:w-px sm:before:-translate-y-1/2 sm:before:bg-border/45",
                )}
              >
                <TrustIcon Icon={Icon} />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold leading-snug text-foreground">{item.title}</p>
                  <p className="text-xs leading-5 text-muted-foreground sm:text-[13px] sm:leading-6">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground sm:text-[13px]">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        {content.stripeNote}
      </p>
    </div>
  );
}
