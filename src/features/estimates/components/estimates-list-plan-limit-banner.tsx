"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { CreateEstimateGate } from "@/features/estimates/lib/create-estimate-gate";
import { cn } from "@/lib/utils";

export function EstimatesListPlanLimitBanner({
  createEstimateGate,
  billingHref,
}: {
  createEstimateGate: CreateEstimateGate;
  billingHref: string | null;
}) {
  const t = useTranslations("estimates.list.planLimitBanner");

  const isPlanLimitReached =
    createEstimateGate.reason === "PLAN_LIMIT" &&
    createEstimateGate.maxEstimatesPerMonth !== null;

  if (!isPlanLimitReached) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        "flex w-full flex-col gap-4 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        "border-amber-500/35 bg-amber-500/8 dark:border-amber-400/30 dark:bg-amber-400/10",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
            "bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
          )}
          aria-hidden
        >
          <AlertTriangle className="size-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{t("title")}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t("description", {
              used: createEstimateGate.estimatesThisMonth,
              limit: createEstimateGate.maxEstimatesPerMonth!,
            })}
          </p>
        </div>
      </div>

      {billingHref ? (
        <Button
          asChild
          variant="outline"
          size="sm"
          className={cn(
            "h-9 shrink-0 gap-1.5 rounded-lg border-amber-500/35 bg-background/60 px-4 text-sm font-medium",
            "text-amber-900 hover:bg-amber-500/10 hover:text-amber-950",
            "dark:border-amber-400/35 dark:text-amber-100 dark:hover:bg-amber-400/10",
          )}
        >
          <Link href={billingHref}>
            {t("cta")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
