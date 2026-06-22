"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkspaceSettingsSubscriptionRequiredWarning({
  title,
  description,
  ctaLabel,
  ctaHref,
  activeUntilLabel,
  periodEndLabel,
  className,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  activeUntilLabel?: string;
  periodEndLabel?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-red-500/25 bg-card p-4 shadow-sm dark:border-red-400/20 sm:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start xl:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-500 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-400 sm:size-11">
            <AlertTriangle className="size-4 sm:size-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1.5">
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 md:w-auto md:min-w-[12rem] md:border-l md:pl-6 xl:flex-row xl:items-center xl:gap-8 xl:pl-8">
          {activeUntilLabel && periodEndLabel ? (
            <div className="space-y-1 xl:text-right">
              <p className="text-sm font-medium text-red-500 dark:text-red-400">
                {activeUntilLabel}
              </p>
              <p className="text-lg font-semibold tracking-tight">{periodEndLabel}</p>
            </div>
          ) : null}

          <div className="w-full xl:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-full border-red-500/50 bg-background px-5 text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-400 dark:border-red-400/40 dark:text-red-400 dark:hover:bg-red-400/10 xl:w-auto"
              asChild
            >
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
