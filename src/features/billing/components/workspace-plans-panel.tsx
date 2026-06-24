"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { SubscriptionPlan } from "@prisma/client";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { appToast } from "@/components/ui/app-toast";

import { Button } from "@/components/ui/button";
import { BillingHandoffBanner } from "@/features/billing/components/billing-handoff-banner";
import { BillingChangePreviewDialog } from "@/features/billing/components/billing-change-preview-dialog";
import { BillingCreditConfirmDialog } from "@/features/billing/components/billing-credit-confirm-dialog";
import {
  PlanCardAddonSubline,
  SubscriptionImpactSummary,
} from "@/features/billing/components/subscription-impact-summary";
import type { WorkspaceBillingPlansPageData } from "@/features/billing/billing-plans-page-data";
import type { BillingChangePreview } from "@/features/billing/billing-page-data";
import type { BillingOwnershipState } from "@/features/billing/lib/billing-permissions-logic";
import { formatBillingMonthlyPrice } from "@/features/billing/lib/format-billing-amount";
import { isBillingPreviewExpired } from "@/features/billing/lib/billing-preview-utils";
import {
  formatPlanLimitLabels,
  PLAN_ORDER,
} from "@/features/billing/lib/format-plan-limit-labels";
import {
  changeWorkspacePlanAction,
  previewWorkspaceBillingChangeAction,
} from "@/features/billing/server/billing-actions";
import { dashboardBillingHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  data: WorkspaceBillingPlansPageData;
  canManageBilling: boolean;
  canChangePlanOrAddons: boolean;
  canPurchaseSubscription: boolean;
  billingOwnershipState: BillingOwnershipState;
  currentPeriodEnd: Date | null;
};

type PlanCardAction =
  | { kind: "current" }
  | { kind: "select"; plan: Exclude<SubscriptionPlan, "FREE"> }
  | { kind: "downgrade"; plan: "PRO" }
  | { kind: "free_hint" };

const planAccent: Record<
  SubscriptionPlan,
  {
    border: string;
    badge: string;
    title: string;
    button: string;
  }
> = {
  FREE: {
    border: "border-border/60",
    badge: "bg-slate-500/15 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
    title: "text-foreground",
    button: "",
  },
  PRO: {
    border: "border-blue-500/25 dark:border-blue-400/20",
    badge: "bg-blue-500/15 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
    title:
      "text-blue-700 dark:bg-gradient-to-b dark:from-blue-200 dark:to-blue-500 dark:bg-clip-text dark:text-transparent",
    button: "bg-blue-600 hover:bg-blue-600/90",
  },
  BUSINESS: {
    border: "border-violet-500/25 dark:border-violet-400/20",
    badge: "bg-violet-500/20 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
    title:
      "text-violet-700 dark:bg-gradient-to-b dark:from-violet-200 dark:to-violet-400 dark:bg-clip-text dark:text-transparent",
    button: "bg-violet-600 hover:bg-violet-600/90",
  },
};

function resolvePlanCardAction(
  currentPlan: SubscriptionPlan,
  cardPlan: SubscriptionPlan,
): PlanCardAction {
  if (currentPlan === cardPlan) {
    return { kind: "current" };
  }

  if (cardPlan === "FREE") {
    return { kind: "free_hint" };
  }

  if (cardPlan === "PRO" && currentPlan === "BUSINESS") {
    return { kind: "downgrade", plan: "PRO" };
  }

  return { kind: "select", plan: cardPlan };
}

function formatLongDate(value: Date | string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(value));
}

export function WorkspacePlansPanel({
  workspaceId,
  workspaceSlug,
  locale,
  data,
  canManageBilling,
  canChangePlanOrAddons,
  canPurchaseSubscription,
  billingOwnershipState,
  currentPeriodEnd,
}: Props) {
  const t = useTranslations("billing.workspace.plans");
  const tHero = useTranslations("billing.workspace.planHero");
  const searchParams = useSearchParams();
  const highlightPlan = searchParams.get("plan");
  const checkoutCancelled = searchParams.get("checkout") === "cancelled";

  const [pending, startTransition] = useTransition();
  const [activePlan, setActivePlan] = useState<SubscriptionPlan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Exclude<SubscriptionPlan, "FREE"> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BillingChangePreview | null>(null);
  const [previewPlan, setPreviewPlan] = useState<Exclude<SubscriptionPlan, "FREE"> | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const cardRefs = useRef<Partial<Record<SubscriptionPlan, HTMLElement | null>>>({});

  const billingHref = dashboardBillingHref(locale, workspaceSlug);
  const unlimitedLabel = t("unlimited");
  const canChangePlan = canChangePlanOrAddons || canPurchaseSubscription;

  useEffect(() => {
    if (!highlightPlan || !PLAN_ORDER.includes(highlightPlan as SubscriptionPlan)) {
      return;
    }

    const element = cardRefs.current[highlightPlan as SubscriptionPlan];
    element?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [highlightPlan]);

  async function applyPlanChange(plan: Exclude<SubscriptionPlan, "FREE">) {
    const result = await changeWorkspacePlanAction(workspaceId, plan);

    if (!result.success) {
      setError(result.error);
      setActivePlan(null);
      return;
    }

    if (result.data.kind === "checkout") {
      window.location.href = result.data.url;
      return;
    }

    if (result.data.kind === "downgrade_scheduled") {
      appToast.success(
        t("downgradeScheduled", {
          plan: tHero(`planName.${result.data.targetPlan}`),
          date: formatLongDate(result.data.effectiveAt),
        }),
      );
      window.location.reload();
      return;
    }

    if (result.data.kind === "updated") {
      appToast.success(t("upgradeSuccess", { plan: tHero(`planName.${result.data.plan}`) }));
      window.location.reload();
      return;
    }

    setActivePlan(null);
  }

  function handlePlanCardClick(plan: Exclude<SubscriptionPlan, "FREE">) {
    setError(null);

    if (data.currentPlan === "FREE") {
      setActivePlan(plan);
      startTransition(async () => {
        await applyPlanChange(plan);
      });
      return;
    }

    if (plan === data.currentPlan) {
      setSelectedPlan(null);
      return;
    }

    setSelectedPlan(plan);
  }

  function handleConfirmPlanChange(planOverride?: Exclude<SubscriptionPlan, "FREE">) {
    const plan = planOverride ?? selectedPlan;
    if (!plan) {
      return;
    }
    setError(null);
    setActivePlan(plan);

    const isPaidUpgrade =
      data.currentPlan !== "FREE" &&
      PLAN_ORDER.indexOf(plan) > PLAN_ORDER.indexOf(data.currentPlan);

    startTransition(async () => {
      if (isPaidUpgrade) {
        const previewResult = await previewWorkspaceBillingChangeAction(workspaceId, {
          kind: "plan",
          targetPlan: plan,
        });

        if (!previewResult.success) {
          setError(previewResult.error);
          setActivePlan(null);
          return;
        }

        setPreview(previewResult.data);
        setPreviewPlan(plan);

        if (previewResult.data.prorationKind === "charge") {
          setPreviewDialogOpen(true);
          return;
        }

        if (previewResult.data.prorationKind === "credit") {
          setCreditDialogOpen(true);
          return;
        }

        await applyPlanChange(plan);
        return;
      }

      await applyPlanChange(plan);
    });
  }

  function handleSelectPlan(plan: SubscriptionPlan) {
    if (plan === "FREE") {
      return;
    }

    handlePlanCardClick(plan);
  }

  function handleConfirmPreview() {
    if (!previewPlan || !preview || isBillingPreviewExpired(preview)) {
      return;
    }

    startTransition(async () => {
      setPreviewDialogOpen(false);
      setCreditDialogOpen(false);
      await applyPlanChange(previewPlan);
    });
  }

  function handleRecalculatePreview() {
    if (!previewPlan) {
      return;
    }

    setPreviewDialogOpen(false);
    setCreditDialogOpen(false);
    handleConfirmPlanChange(previewPlan);
  }

  const previewExpired = isBillingPreviewExpired(preview);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href={billingHref}>
            <ArrowLeft className="size-4" aria-hidden />
            {t("backToBilling")}
          </Link>
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </header>

      {checkoutCancelled ? (
        <div className="rounded-md border border-amber-300/80 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          {t("checkoutCancelled")}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100">
          {error}
        </div>
      ) : null}

      <BillingHandoffBanner
        billingOwnershipState={billingOwnershipState}
        canManageBilling={canManageBilling}
        canPurchaseSubscription={canPurchaseSubscription}
        currentPeriodEnd={currentPeriodEnd}
      />

      {!canChangePlan && billingOwnershipState !== "NORMAL" ? (
        <div className="rounded-md border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
          {t("handoffReadOnlyPlans")}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-stretch lg:gap-6">
        {PLAN_ORDER.map((plan) => {
          const limits = data.planLimits[plan];
          const labels = formatPlanLimitLabels(limits, unlimitedLabel);
          const action = resolvePlanCardAction(data.currentPlan, plan);
          const accent = planAccent[plan];
          const isHighlighted = highlightPlan === plan;
          const isCurrent = data.currentPlan === plan;
          const isLoading = pending && activePlan === plan;
          const isSelected = selectedPlan === plan;

          const featureRows = [
            { key: "estimates", value: labels.estimates },
            { key: "ai", value: labels.ai },
            { key: "users", value: labels.users },
            { key: "storage", value: labels.storage },
            { key: "invites", value: labels.invites },
            { key: "undo", value: labels.undo },
          ] as const;

          return (
            <article
              key={plan}
              ref={(node) => {
                cardRefs.current[plan] = node;
              }}
              className={cn(
                "flex h-full min-h-[460px] min-w-0 flex-col rounded-xl border bg-card p-6 shadow-sm transition-shadow lg:min-h-[540px]",
                accent.border,
                isCurrent && "ring-2 ring-primary/30",
                isHighlighted && !isCurrent && "ring-2 ring-primary/20",
                isSelected && !isCurrent && "ring-2 ring-primary/40",
              )}
            >
              <div className="flex flex-1 flex-col space-y-4">
                <div className="space-y-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
                      accent.badge,
                    )}
                  >
                    {isCurrent ? t("currentPlanBadge") : tHero(`planName.${plan}`)}
                  </span>
                  <h2 className={cn("text-3xl font-bold tracking-tight", accent.title)}>
                    {tHero(`planName.${plan}`)}
                  </h2>
                  <p className="text-sm text-muted-foreground">{tHero(`description.${plan}`)}</p>
                </div>

                <p className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tracking-tight">
                    {formatBillingMonthlyPrice(data.catalogPlanPriceCents[plan], locale)}
                  </span>
                  <span className="text-sm text-muted-foreground">{tHero("perMonth")}</span>
                </p>
                <PlanCardAddonSubline
                  plan={plan}
                  currentAddons={data.addonQuantities}
                  locale={locale}
                />

                <ul className="space-y-2.5 border-t border-border/50 pt-4">
                  {featureRows.map((row) => (
                    <li key={row.key} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-primary/80"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="text-muted-foreground">
                          {t(`features.${row.key}`)}:{" "}
                        </span>
                        <span className="font-medium text-foreground">{row.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto flex min-h-[5.5rem] flex-col justify-end pt-6">
                {action.kind === "current" ? (
                  <Button variant="outline" className="h-11 w-full" disabled>
                    {t("currentPlan")}
                  </Button>
                ) : null}

                {action.kind === "free_hint" && canManageBilling ? (
                  <div className="space-y-2">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t("freeDowngradeHint")}
                    </p>
                    <Button variant="outline" className="h-11 w-full" asChild>
                      <Link href={billingHref}>{t("manageOnBilling")}</Link>
                    </Button>
                  </div>
                ) : null}

                {action.kind === "select" && canChangePlan ? (
                  <Button
                    className={cn("h-11 w-full", accent.button)}
                    disabled={pending}
                    onClick={() => handleSelectPlan(action.plan)}
                  >
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                    {t("upgradeTo", { plan: tHero(`planName.${action.plan}`) })}
                  </Button>
                ) : null}

                {action.kind === "downgrade" && canChangePlan ? (
                  <Button
                    variant="outline"
                    className="h-11 w-full"
                    disabled={pending}
                    onClick={() => handleSelectPlan(action.plan)}
                  >
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                    {t("downgradeTo", { plan: tHero(`planName.${action.plan}`) })}
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {selectedPlan && selectedPlan !== data.currentPlan && data.currentPlan !== "FREE" ? (
        <SubscriptionImpactSummary
          variant="plan"
          locale={locale}
          currentPlan={data.currentPlan}
          selectedPlan={selectedPlan}
          currentAddons={data.addonQuantities}
          currentPeriodEnd={currentPeriodEnd}
          activeSubscriptionChange={data.activeSubscriptionChange}
        >
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setSelectedPlan(null)}
            >
              {t("cancelSelection")}
            </Button>
            <Button
              type="button"
              disabled={pending || !canChangePlan}
              onClick={() => handleConfirmPlanChange()}
            >
              {pending && activePlan === selectedPlan ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {PLAN_ORDER.indexOf(selectedPlan) > PLAN_ORDER.indexOf(data.currentPlan)
                ? t("confirmUpgrade", { plan: tHero(`planName.${selectedPlan}`) })
                : t("confirmDowngrade", { plan: tHero(`planName.${selectedPlan}`) })}
            </Button>
          </div>
        </SubscriptionImpactSummary>
      ) : null}

      <BillingChangePreviewDialog
        open={previewDialogOpen}
        preview={preview}
        locale={locale}
        pending={pending}
        expired={previewExpired}
        onOpenChange={setPreviewDialogOpen}
        onConfirm={handleConfirmPreview}
        onRecalculate={handleRecalculatePreview}
      />
      <BillingCreditConfirmDialog
        open={creditDialogOpen}
        preview={preview}
        locale={locale}
        pending={pending}
        expired={previewExpired}
        onOpenChange={setCreditDialogOpen}
        onConfirm={handleConfirmPreview}
        onRecalculate={handleRecalculatePreview}
      />
    </div>
  );
}
