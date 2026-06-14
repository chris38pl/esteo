"use client";

import { useState } from "react";
import type { SubscriptionPlan } from "@prisma/client";
import { ArrowRight, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HeroCardArtwork } from "@/components/hero-card/hero-card-artwork";
import { BillingPlanHeroStyles } from "@/features/billing/components/billing-plan-hero-styles";
import {
  BILLING_PLAN_HERO_IMAGES,
  billingPlanHeroCardClass,
} from "@/features/billing/lib/billing-plan-hero-images";
import type { WorkspaceEffectiveStatus } from "@/server/permissions/domain";
import { cn } from "@/lib/utils";

type Props = {
  plan: SubscriptionPlan;
  effectiveStatus: WorkspaceEffectiveStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | string | null;
  pending: boolean;
  onChangePlan: (plan: SubscriptionPlan) => void;
  onManageBilling: () => void;
};

function formatLongDate(value: Date | string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(value));
}

function daysUntil(value: Date | string): number {
  const target = new Date(value);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

const planAccent: Record<
  SubscriptionPlan,
  {
    badge: string;
    badgeText: string;
    title: string;
    border: string;
  }
> = {
  FREE: {
    badge: "bg-slate-500/15 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
    badgeText: "",
    title: "text-foreground",
    border: "border-border/60",
  },
  PRO: {
    badge: "bg-blue-500/15 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
    badgeText: "",
    title: "bg-gradient-to-b from-blue-300 to-blue-600 bg-clip-text text-transparent dark:from-blue-200 dark:to-blue-500",
    border: "border-blue-500/20 dark:border-blue-400/20",
  },
  BUSINESS: {
    badge: "bg-violet-500/20 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
    badgeText: "",
    title: "bg-gradient-to-b from-violet-200 to-violet-500 bg-clip-text text-transparent dark:from-violet-200 dark:to-violet-400",
    border: "border-violet-500/25 dark:border-violet-400/20",
  },
};

function availablePlanTargets(plan: SubscriptionPlan): SubscriptionPlan[] {
  if (plan === "FREE") {
    return ["PRO", "BUSINESS"];
  }
  if (plan === "PRO") {
    return ["BUSINESS"];
  }
  return ["PRO"];
}

export function BillingPlanHeroBanner({
  plan,
  effectiveStatus,
  cancelAtPeriodEnd,
  currentPeriodEnd,
  pending,
  onChangePlan,
  onManageBilling,
}: Props) {
  const t = useTranslations("billing.workspace.planHero");
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const images = BILLING_PLAN_HERO_IMAGES[plan];
  const accent = planAccent[plan];

  const isPaidPlan = plan !== "FREE";
  const showPeriodRow = isPaidPlan && currentPeriodEnd != null && effectiveStatus === "ACTIVE";
  const periodDateLabel = currentPeriodEnd ? formatLongDate(currentPeriodEnd) : null;
  const daysLeft = currentPeriodEnd ? daysUntil(currentPeriodEnd) : null;

  const badgeLabel =
    cancelAtPeriodEnd && effectiveStatus === "ACTIVE"
      ? t("badge.canceling")
      : effectiveStatus === "ACTIVE"
        ? t("badge.active")
        : t(`badge.status.${effectiveStatus}`);

  return (
    <>
      <BillingPlanHeroStyles plan={plan} />
      <article
        className={cn(
          "billing-plan-hero-card",
          billingPlanHeroCardClass(plan),
          "relative isolate min-h-[15rem] overflow-hidden rounded-xl border shadow-sm md:min-h-[17rem]",
          accent.border,
        )}
      >
        <HeroCardArtwork
          lightSrc={images.light}
          darkSrc={images.dark}
          mainImageClassName="billing-plan-hero-artwork-main"
        />

        <div className="hero-card-body hero-card-body--with-scrim flex min-h-[15rem] flex-col justify-between gap-6 p-6 md:min-h-[17rem] md:p-8">
          <div aria-hidden className="hero-card-text-scrim--body" />
          <div className="hero-card-body-inner flex min-h-full flex-col justify-between gap-6">
          <div className="hero-card-content space-y-5">
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                accent.badge,
              )}
            >
              {badgeLabel}
            </span>

            <div className="space-y-2">
              <h2
                className={cn(
                  "text-4xl font-bold uppercase tracking-tight md:text-5xl",
                  accent.title,
                )}
              >
                {t(`planName.${plan}`)}
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">{t(`description.${plan}`)}</p>
            </div>

            {showPeriodRow && periodDateLabel ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4 shrink-0 text-violet-400" aria-hidden />
                <span>
                  {cancelAtPeriodEnd
                    ? t("cancelsOn", { date: periodDateLabel })
                    : t("renewal", { date: periodDateLabel })}
                </span>
                {daysLeft != null ? (
                  <span className="rounded-md border border-border/60 bg-background/40 px-2 py-0.5 text-xs font-medium text-foreground/80">
                    {t("daysUntil", { days: daysLeft })}
                  </span>
                ) : null}
              </div>
            ) : null}

            <p className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight md:text-4xl">
                {t(`price.${plan}`)}
              </span>
              <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
            </p>
          </div>

          <div className="billing-plan-hero-actions hero-card-content flex w-full flex-col gap-3 sm:flex-row">
            <Button
              className={cn(
                "h-11 justify-center gap-2",
                isPaidPlan ? "w-full sm:flex-1" : "w-full sm:w-auto sm:flex-none",
              )}
              disabled={pending}
              onClick={() => setChangePlanOpen(true)}
            >
              {t("changePlan")}
              <ArrowRight className="size-4" aria-hidden />
            </Button>

            {isPaidPlan ? (
              <Button
                variant="outline"
                className="h-11 w-full border-border/70 bg-background/50 px-5 text-sm font-medium backdrop-blur-sm sm:flex-1"
                disabled={pending}
                onClick={onManageBilling}
              >
                {t("managePayment")}
              </Button>
            ) : null}
          </div>
          </div>
        </div>
      </article>

      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("changePlanDialog.title")}</DialogTitle>
            <DialogDescription>{t("changePlanDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            {availablePlanTargets(plan).map((candidate) => (
              <Button
                key={candidate}
                variant="outline"
                className="h-11 justify-between"
                disabled={pending}
                onClick={() => {
                  setChangePlanOpen(false);
                  onChangePlan(candidate);
                }}
              >
                <span>{t(`planName.${candidate}`)}</span>
                <span className="text-muted-foreground">{t(`price.${candidate}`)}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
