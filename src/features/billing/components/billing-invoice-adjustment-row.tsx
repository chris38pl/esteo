"use client";

import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function BillingInvoiceAdjustmentRow({
  label,
  amount,
  badge,
  tooltip,
}: {
  label: string;
  amount: string;
  badge?: { label: string; variant: "amber" | "green" };
  tooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="min-w-0 text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 truncate">{label}</span>

          {badge ? (
            <span
              className={cn(
                "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
                badge.variant === "amber"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              )}
            >
              {badge.label}
            </span>
          ) : null}

          {tooltip ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center justify-center rounded-sm text-muted-foreground transition",
                      "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                    )}
                    aria-label="Info"
                  >
                    <Info className="size-3.5" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[320px] whitespace-pre-wrap">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      </dt>

      <dd className="font-medium">{amount}</dd>
    </div>
  );
}

