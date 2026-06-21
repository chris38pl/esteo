"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import type { SubscriptionPlan } from "@prisma/client";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coins,
  Info,
  Loader2,
  Minus,
  Plus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BillingHandoffBanner } from "@/features/billing/components/billing-handoff-banner";
import { BillingChangePreviewDialog } from "@/features/billing/components/billing-change-preview-dialog";
import { BillingCreditConfirmDialog } from "@/features/billing/components/billing-credit-confirm-dialog";
import type { WorkspaceBillingManagePageData } from "@/features/billing/billing-manage-page-data";
import type { BillingChangePreview } from "@/features/billing/billing-page-data";
import type { BillingOwnershipState } from "@/features/billing/lib/billing-permissions-logic";
import { formatBillingMonthlyPrice, formatSignedBillingAmount } from "@/features/billing/lib/format-billing-amount";
import { formatRecurringLineItemLabel } from "@/features/billing/lib/format-recurring-line-item-label";
import { isBillingPreviewExpired } from "@/features/billing/lib/billing-preview-utils";
import {
  formatPlanLimitLabels,
  PLAN_ORDER,
} from "@/features/billing/lib/format-plan-limit-labels";
import {
  buildRecurringLineItems,
  applyReferralDiscountToLineItems,
  computePlanImpactSummary,
  projectAddonQuantitiesAfterPlanChange,
  splitLimitImpacts,
  type AddonImpactRow,
  type LimitImpactRow,
  type PlanImpactSummary,
} from "@/features/billing/lib/subscription-impact";
import {
  changeWorkspaceAddonQuantityAction,
  changeWorkspacePlanAction,
  previewWorkspaceBillingChangeAction,
} from "@/features/billing/server/billing-actions";
import { dashboardBillingHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import {
  ADDON_UNIT_PRICES_PLN,
  MAX_ADDON_QUANTITY,
  SEAT_UNIT_COUNT,
  STORAGE_UNIT_BYTES,
} from "@/server/billing/addon-catalog";
import { cn } from "@/lib/utils";

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  data: WorkspaceBillingManagePageData;
  canManageBilling: boolean;
  canChangePlanOrAddons: boolean;
  canPurchaseSubscription: boolean;
  billingOwnershipState: BillingOwnershipState;
  currentPeriodEnd: Date | null;
};

const planAccent: Record<
  SubscriptionPlan,
  {
    border: string;
    badge: string;
    title: string;
  }
> = {
  FREE: {
    border: "border-border/60",
    badge: "bg-slate-500/15 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
    title: "text-foreground",
  },
  PRO: {
    border: "border-blue-500/25 dark:border-blue-400/20",
    badge: "bg-blue-500/15 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
    title:
      "text-blue-700 dark:bg-gradient-to-b dark:from-blue-200 dark:to-blue-500 dark:bg-clip-text dark:text-transparent",
  },
  BUSINESS: {
    border: "border-violet-500/25 dark:border-violet-400/20",
    badge: "bg-violet-500/20 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
    title:
      "text-violet-700 dark:bg-gradient-to-b dark:from-violet-200 dark:to-violet-400 dark:bg-clip-text dark:text-transparent",
  },
};

function formatLongDate(value: Date | string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(value));
}

function formatGb(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 10 || Number.isInteger(gb)) {
    return `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`;
  }
  return `${gb.toFixed(1)} GB`;
}

export function WorkspaceSubscriptionManagePanel({
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
  const t = useTranslations("billing.workspace.manage");
  const tPlans = useTranslations("billing.workspace.plans");
  const tHero = useTranslations("billing.workspace.planHero");
  const searchParams = useSearchParams();
  const highlightPlan = searchParams.get("plan");
  const checkoutCancelled = searchParams.get("checkout") === "cancelled";

  const billingHref = dashboardBillingHref(locale, workspaceSlug);
  const unlimitedLabel = tPlans("unlimited");
  const canChange = canChangePlanOrAddons || canPurchaseSubscription;
  const isFree = data.currentPlan === "FREE";

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(data.currentPlan);
  const [storageQty, setStorageQty] = useState(data.addonQuantities.storage);
  const [seatQty, setSeatQty] = useState(data.addonQuantities.seats);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BillingChangePreview | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"plan" | "addons" | null>(null);
  const cardRefs = useRef<Partial<Record<SubscriptionPlan, HTMLElement | null>>>({});

  const planLabels = useMemo(
    () =>
      ({
        FREE: tHero("planName.FREE"),
        PRO: tHero("planName.PRO"),
        BUSINESS: tHero("planName.BUSINESS"),
      }) as Record<SubscriptionPlan, string>,
    [tHero],
  );

  const targetAddons = useMemo(
    () =>
      projectAddonQuantitiesAfterPlanChange(selectedPlan, {
        storage: storageQty,
        seats: seatQty,
      }),
    [selectedPlan, storageQty, seatQty],
  );

  const planDirty = selectedPlan !== data.currentPlan && selectedPlan !== "FREE";
  const addonDirty =
    targetAddons.storage !== data.addonQuantities.storage ||
    targetAddons.seats !== data.addonQuantities.seats;
  const isDirty = planDirty || addonDirty || (isFree && selectedPlan !== "FREE");

  const isBusinessTarget = selectedPlan === "BUSINESS";
  const canBuyStorage = selectedPlan === "PRO" || selectedPlan === "BUSINESS";

  const afterLineItemsFull = buildRecurringLineItems(selectedPlan, targetAddons);
  const afterLineItems = applyReferralDiscountToLineItems(
    afterLineItemsFull,
    selectedPlan,
    data.referralDiscount?.discountedPlanPriceCents,
  );
  const afterTotal = afterLineItems.reduce((sum, item) => sum + item.cents, 0);
  const afterTotalRegular = afterLineItemsFull.reduce((sum, item) => sum + item.cents, 0);
  const referralPromoActive =
    data.referralDiscount != null &&
    afterTotal !== afterTotalRegular &&
    (selectedPlan === "PRO" || selectedPlan === "BUSINESS");
  const currentLineItems = buildRecurringLineItems(data.currentPlan, data.addonQuantities);
  const currentTotal = currentLineItems.reduce((sum, item) => sum + item.cents, 0);
  const addonOnlyDirty = !planDirty && addonDirty;

  const impact = useMemo(() => {
    if (!isDirty || selectedPlan === "FREE") {
      return null;
    }
    return computePlanImpactSummary({
      currentPlan: data.currentPlan,
      targetPlan: selectedPlan,
      currentAddons: data.addonQuantities,
      targetAddons,
      effectiveAt: currentPeriodEnd,
      unlimitedLabel,
    });
  }, [
    isDirty,
    selectedPlan,
    data.currentPlan,
    data.addonQuantities,
    targetAddons,
    currentPeriodEnd,
    unlimitedLabel,
  ]);

  useEffect(() => {
    if (!highlightPlan || !PLAN_ORDER.includes(highlightPlan as SubscriptionPlan)) {
      return;
    }
    const plan = highlightPlan as SubscriptionPlan;
    setSelectedPlan(plan);
    const element = cardRefs.current[plan];
    element?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [highlightPlan]);

  useEffect(() => {
    if (selectedPlan !== "BUSINESS" && seatQty > 0) {
      setSeatQty(0);
    }
  }, [selectedPlan, seatQty]);

  function handleSelectPlan(plan: SubscriptionPlan) {
    if (!canChange || plan === "FREE") {
      return;
    }
    setError(null);
    setSelectedPlan(plan);
  }

  async function applyAddonChanges() {
    if (targetAddons.storage !== data.addonQuantities.storage && canBuyStorage) {
      const result = await changeWorkspaceAddonQuantityAction(
        workspaceId,
        "STORAGE",
        targetAddons.storage,
      );
      if (!result.success) {
        setError(result.error);
        return false;
      }
    }

    if (targetAddons.seats !== data.addonQuantities.seats && isBusinessTarget) {
      const result = await changeWorkspaceAddonQuantityAction(
        workspaceId,
        "SEATS",
        targetAddons.seats,
      );
      if (!result.success) {
        setError(result.error);
        return false;
      }
    }

    return true;
  }

  function resolveBillingActionError(result: { error: string; errorCode?: string }): string {
    if (result.errorCode === "REFERRAL_COUPON_NOT_CONFIGURED") {
      return t("referralCouponNotConfigured");
    }
    return result.error;
  }

  async function applyPlanChange(plan: Exclude<SubscriptionPlan, "FREE">) {
    const result = await changeWorkspacePlanAction(workspaceId, plan);

    if (!result.success) {
      setError(resolveBillingActionError(result));
      return false;
    }

    if (result.data.kind === "checkout") {
      window.location.href = result.data.url;
      return true;
    }

    if (result.data.kind === "downgrade_scheduled") {
      toast.success(
        tPlans("downgradeScheduled", {
          plan: tHero(`planName.${result.data.targetPlan}`),
          date: formatLongDate(result.data.effectiveAt),
        }),
      );
      return true;
    }

    if (result.data.kind === "updated") {
      toast.success(tPlans("upgradeSuccess", { plan: tHero(`planName.${result.data.plan}`) }));
      return true;
    }

    return true;
  }

  function handleContinue() {
    setError(null);

    if (isFree && selectedPlan !== "FREE") {
      startTransition(async () => {
        await applyPlanChange(selectedPlan as Exclude<SubscriptionPlan, "FREE">);
      });
      return;
    }

    const isPaidUpgrade =
      planDirty &&
      PLAN_ORDER.indexOf(selectedPlan) > PLAN_ORDER.indexOf(data.currentPlan);

    startTransition(async () => {
      if (planDirty && isPaidUpgrade) {
        const previewResult = await previewWorkspaceBillingChangeAction(workspaceId, {
          kind: "plan",
          targetPlan: selectedPlan as Exclude<SubscriptionPlan, "FREE">,
        });
        if (!previewResult.success) {
          setError(previewResult.error);
          return;
        }
        setPreview(previewResult.data);
        setPreviewMode("plan");
        if (previewResult.data.prorationKind === "charge") {
          setPreviewDialogOpen(true);
          return;
        }
        if (previewResult.data.prorationKind === "credit") {
          setCreditDialogOpen(true);
          return;
        }
        const ok = await applyPlanChange(selectedPlan as Exclude<SubscriptionPlan, "FREE">);
        if (ok && addonDirty) {
          const addonsOk = await applyAddonChanges();
          if (addonsOk) {
            toast.success(t("saveSuccess"));
            window.location.reload();
          }
        } else if (ok) {
          window.location.reload();
        }
        return;
      }

      if (planDirty && !isPaidUpgrade) {
        const ok = await applyPlanChange(selectedPlan as Exclude<SubscriptionPlan, "FREE">);
        if (ok) {
          window.location.reload();
        }
        return;
      }

      if (addonDirty) {
        const previewResult = await previewWorkspaceBillingChangeAction(workspaceId, {
          kind: "addons",
          storageQuantity: targetAddons.storage,
          seatQuantity: targetAddons.seats,
        });
        if (!previewResult.success) {
          setError(previewResult.error);
          return;
        }
        setPreview(previewResult.data);
        setPreviewMode("addons");
        if (previewResult.data.prorationKind === "charge") {
          setPreviewDialogOpen(true);
          return;
        }
        if (previewResult.data.prorationKind === "credit") {
          setCreditDialogOpen(true);
          return;
        }
        const ok = await applyAddonChanges();
        if (ok) {
          toast.success(t("saveSuccess"));
          window.location.reload();
        }
      }
    });
  }

  function handleConfirmPreview() {
    if (!preview || isBillingPreviewExpired(preview)) {
      return;
    }

    startTransition(async () => {
      setPreviewDialogOpen(false);
      setCreditDialogOpen(false);

      if (previewMode === "plan" && planDirty) {
        const ok = await applyPlanChange(selectedPlan as Exclude<SubscriptionPlan, "FREE">);
        if (!ok) {
          return;
        }
        if (addonDirty) {
          const addonsOk = await applyAddonChanges();
          if (!addonsOk) {
            return;
          }
        }
        toast.success(t("saveSuccess"));
        window.location.reload();
        return;
      }

      if (previewMode === "addons") {
        const ok = await applyAddonChanges();
        if (ok) {
          toast.success(t("saveSuccess"));
          window.location.reload();
        }
      }
    });
  }

  function handleRecalculatePreview() {
    setPreviewDialogOpen(false);
    setCreditDialogOpen(false);
    handleContinue();
  }

  const previewExpired = isBillingPreviewExpired(preview);
  const baseStorage = data.entitlements.baseLimits.maxStorageBytes;
  const baseSeats = data.entitlements.baseLimits.maxInvitedSeats ?? 0;
  const baseUsers = baseSeats + 1;

  return (
    <div className="space-y-6 pb-6">
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
          {tPlans("checkoutCancelled")}
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

      {!canChange && billingOwnershipState !== "NORMAL" ? (
        <div className="rounded-md border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
          {tPlans("handoffReadOnlyPlans")}
        </div>
      ) : null}

      <ManageStep step={1} title={t("planSection")} emphasis>
        {data.referralDiscount ? (
          <div className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-950 dark:text-emerald-100">
            {t("referralDiscountBanner", {
              percent: data.referralDiscount.percent,
              months: data.referralDiscount.months,
            })}
          </div>
        ) : data.referralDiscountUnavailable ? (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
            {t("referralDiscountUnavailableBanner")}
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-stretch">
          {PLAN_ORDER.map((plan) => {
            const limits = data.planLimits[plan];
            const labels = formatPlanLimitLabels(limits, unlimitedLabel);
            const accent = planAccent[plan];
            const isCurrent = data.currentPlan === plan;
            const isSelected = selectedPlan === plan;
            const isFreeCard = plan === "FREE";

            const featureRows = [
              { key: "estimates", value: labels.estimates },
              { key: "ai", value: labels.ai },
              { key: "users", value: labels.users },
              { key: "storage", value: labels.storage },
            ] as const;

            return (
              <article
                key={plan}
                ref={(node) => {
                  cardRefs.current[plan] = node;
                }}
                role="button"
                tabIndex={canChange && !isFreeCard ? 0 : undefined}
                onClick={() => handleSelectPlan(plan)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelectPlan(plan);
                  }
                }}
                className={cn(
                  "relative flex min-h-[248px] cursor-default flex-col rounded-xl border bg-card p-5 shadow-sm transition-all",
                  isSelected
                    ? "z-[1] border-2 border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/30"
                    : cn(accent.border, "border-border/60 bg-card"),
                  !isSelected && canChange && !isFreeCard && "hover:border-blue-500/30 hover:bg-card",
                  canChange && !isFreeCard && "cursor-pointer",
                )}
              >
                {isSelected ? (
                  <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                ) : null}

                <div className="flex flex-1 flex-col space-y-2.5">
                  <div className="space-y-1">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
                        isCurrent
                          ? "bg-blue-500/15 text-blue-700 dark:bg-blue-500/25 dark:text-blue-200"
                          : accent.badge,
                      )}
                    >
                      {isCurrent ? tPlans("currentPlanBadge") : tHero(`planName.${plan}`)}
                    </span>
                    <h3 className={cn("text-2xl font-bold tracking-tight", accent.title)}>
                      {tHero(`planName.${plan}`)}
                    </h3>
                  </div>
                  <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                    {data.referralDiscount &&
                    (plan === "PRO" || plan === "BUSINESS") &&
                    data.referralDiscount.discountedPlanPriceCents[plan] != null ? (
                      <>
                        <span className="text-lg font-medium tabular-nums text-muted-foreground line-through">
                          {formatBillingMonthlyPrice(data.catalogPlanPriceCents[plan], locale)}
                        </span>
                        <span className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatBillingMonthlyPrice(
                            data.referralDiscount.discountedPlanPriceCents[plan]!,
                            locale,
                          )}
                        </span>
                        <span className="text-sm text-muted-foreground">{t("perMonthPromo")}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl font-semibold tabular-nums">
                          {formatBillingMonthlyPrice(data.catalogPlanPriceCents[plan], locale)}
                        </span>
                        <span className="text-sm text-muted-foreground">{tHero("perMonth")}</span>
                      </>
                    )}
                  </p>
                  <ul className="space-y-1.5 border-t border-border/50 pt-3 text-sm">
                    {featureRows.map((row) => (
                      <li key={row.key} className="flex gap-2">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-blue-400/80" />
                        <span>
                          <span className="text-muted-foreground">
                            {tPlans(`features.${row.key}`)}:{" "}
                          </span>
                          <span className="font-medium">{row.value}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {isFreeCard && data.currentPlan !== "FREE" ? (
                  <p className="mt-4 text-xs text-muted-foreground">{tPlans("freeDowngradeHint")}</p>
                ) : null}
              </article>
            );
          })}
        </div>
      </ManageStep>

      {!isFree ? (
        <ManageStep step={2} title={t("addonsSection")} compact>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {canBuyStorage ? (
              <AddonProductCard
                icon={Coins}
                iconBoxClassName="border-orange-500/25 bg-orange-500/10"
                iconClassName="text-orange-400"
                title={t("storage.title")}
                totalLabel={t("storage.totalShort", {
                  amount: formatGb(baseStorage + targetAddons.storage * STORAGE_UNIT_BYTES),
                })}
                packLabel={t("storage.packCount", { count: storageQty })}
                monthlyPrice={t("storage.monthlyPrice", {
                  amount: storageQty * ADDON_UNIT_PRICES_PLN.STORAGE,
                })}
                quantity={storageQty}
                max={MAX_ADDON_QUANTITY.STORAGE}
                disabled={pending || !canChange}
                onChange={setStorageQty}
              />
            ) : null}

            {isBusinessTarget ? (
              <AddonProductCard
                icon={Users}
                iconBoxClassName="border-violet-500/25 bg-violet-500/10"
                iconClassName="text-violet-400"
                title={t("seats.title")}
                totalLabel={t("seats.totalShort", {
                  count: baseUsers + targetAddons.seats * SEAT_UNIT_COUNT,
                })}
                packLabel={t("seats.packCount", { count: seatQty })}
                monthlyPrice={t("seats.monthlyPrice", {
                  amount: seatQty * ADDON_UNIT_PRICES_PLN.SEATS,
                })}
                quantity={seatQty}
                max={MAX_ADDON_QUANTITY.SEATS}
                disabled={pending || !canChange}
                onChange={setSeatQty}
              />
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 bg-card p-3.5 shadow-sm">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10">
                  <Users className="size-4 text-violet-400" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{t("seats.title")}</h3>
                  <p className="text-xs text-muted-foreground">{t("seats.proOnly")}</p>
                </div>
              </div>
            )}
          </div>
        </ManageStep>
      ) : null}

      {isDirty ? (
        <ManageStep step={isFree ? 2 : 3} title={t("summarySection")} compact>
          <ChangeSummaryCard
            currentPlan={data.currentPlan}
            targetPlan={selectedPlan}
            currentLineItems={currentLineItems}
            afterLineItems={afterLineItems}
            afterLineItemsRegular={afterLineItemsFull}
            currentTotal={currentTotal}
            afterTotal={afterTotal}
            afterTotalRegular={afterTotalRegular}
            referralPromo={
              referralPromoActive && data.referralDiscount
                ? { months: data.referralDiscount.months }
                : null
            }
            recurringDeltaCents={afterTotal - currentTotal}
            locale={locale}
            planLabels={planLabels}
            impactPanel={
              impact && planDirty ? (
                <PlanChangeImpactDetails impact={impact} column />
              ) : impact && addonOnlyDirty ? (
                <AddonChangeImpactDetails impact={impact} showUnchanged column />
              ) : null
            }
            continueLabel={t("continue")}
            continueHint={t("continueHint")}
            continueDisabled={pending || !canChange}
            continuePending={pending}
            onContinue={handleContinue}
          />
        </ManageStep>
      ) : (
        <div className="flex justify-end border-t border-border/30 pt-4">
          <Button className="gap-2" disabled>
            {t("continue")}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}

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

function ManageStep({
  step,
  title,
  children,
  emphasis = false,
  compact = false,
}: {
  step: number;
  title: string;
  children: ReactNode;
  emphasis?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("billing.workspace.manage");

  return (
    <section className={cn("space-y-3", emphasis && "space-y-4")}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 shadow-sm",
          emphasis && "border-primary/20",
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground dark:bg-primary dark:text-primary-foreground",
            emphasis
              ? "size-10 text-base shadow-md shadow-primary/20"
              : "size-7 text-xs",
          )}
        >
          {step}
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "font-semibold uppercase tracking-[0.12em] text-primary",
              emphasis ? "text-[11px]" : "text-[10px]",
            )}
          >
            {t("stepLabel", { step })}
          </p>
          <h2
            className={cn(
              "font-semibold tracking-tight",
              emphasis ? "text-lg" : compact ? "text-base" : "text-lg",
            )}
          >
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function AddonProductCard({
  icon: Icon,
  iconBoxClassName,
  iconClassName,
  title,
  totalLabel,
  packLabel,
  monthlyPrice,
  quantity,
  max,
  disabled,
  onChange,
}: {
  icon: typeof Coins;
  iconBoxClassName: string;
  iconClassName: string;
  title: string;
  totalLabel: string;
  packLabel: string;
  monthlyPrice: string;
  quantity: number;
  max: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const t = useTranslations("billing.workspace.manage");

  return (
    <article className="rounded-xl border border-border/60 bg-card p-3.5 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg border",
            iconBoxClassName,
          )}
        >
          <Icon className={cn("size-4", iconClassName)} aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
            <p className="text-sm font-medium text-muted-foreground tabular-nums">{totalLabel}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0"
                disabled={disabled || quantity <= 0}
                onClick={() => onChange(Math.max(0, quantity - 1))}
                aria-label={t("decrease")}
              >
                <Minus className="size-3.5" />
              </Button>
              <p className="min-w-[88px] text-center text-sm font-medium">{packLabel}</p>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0"
                disabled={disabled || quantity >= max}
                onClick={() => onChange(Math.min(max, quantity + 1))}
                aria-label={t("increase")}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
            <p className="text-sm font-medium tabular-nums text-foreground">{monthlyPrice}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function ChangeSummaryCard({
  currentPlan,
  targetPlan,
  currentLineItems,
  afterLineItems,
  afterLineItemsRegular,
  currentTotal,
  afterTotal,
  afterTotalRegular,
  referralPromo,
  recurringDeltaCents,
  locale,
  planLabels,
  impactPanel,
  continueLabel,
  continueHint,
  continueDisabled,
  continuePending,
  onContinue,
}: {
  currentPlan: SubscriptionPlan;
  targetPlan: SubscriptionPlan;
  currentLineItems: ReturnType<typeof buildRecurringLineItems>;
  afterLineItems: ReturnType<typeof buildRecurringLineItems>;
  afterLineItemsRegular: ReturnType<typeof buildRecurringLineItems>;
  currentTotal: number;
  afterTotal: number;
  afterTotalRegular: number;
  referralPromo: { months: number } | null;
  recurringDeltaCents: number;
  locale: Locale;
  planLabels: Record<SubscriptionPlan, string>;
  impactPanel?: ReactNode;
  continueLabel: string;
  continueHint: string;
  continueDisabled: boolean;
  continuePending: boolean;
  onContinue: () => void;
}) {
  const tImpact = useTranslations("billing.workspace.impactSummary");
  const tManage = useTranslations("billing.workspace.manage");
  const perMonth = locale === "pl" ? "mies." : "mo.";

  function renderLineItems(
    plan: SubscriptionPlan,
    lineItems: ReturnType<typeof buildRecurringLineItems>,
    total: number,
    options?: {
      lineItemsRegular?: ReturnType<typeof buildRecurringLineItems>;
      showReferralPromo?: boolean;
      regularTotal?: number;
    },
  ) {
    const regularByKind = new Map(
      (options?.lineItemsRegular ?? []).map((item) => [item.kind, item.cents]),
    );

    return (
      <>
        <ul className="space-y-1 text-xs">
          {lineItems.map((item) => {
            const regularCents = regularByKind.get(item.kind);
            const showPlanPromo =
              options?.showReferralPromo &&
              item.kind === "plan" &&
              regularCents != null &&
              regularCents !== item.cents;

            return (
              <li key={`${item.kind}-${item.quantity ?? 0}`} className="flex justify-between gap-2">
                <span className="truncate text-muted-foreground">
                  {formatRecurringLineItemLabel(
                    item,
                    item.kind === "plan" ? plan : null,
                    planLabels,
                    (key, values) => tImpact(key, values ?? {}),
                  )}
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {showPlanPromo ? (
                    <>
                      <span className="mr-1 text-muted-foreground line-through decoration-muted-foreground/50">
                        {formatBillingMonthlyPrice(regularCents, locale)}
                      </span>
                      {formatBillingMonthlyPrice(item.cents, locale)}
                    </>
                  ) : (
                    formatBillingMonthlyPrice(item.cents, locale)
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex flex-col gap-0.5 border-t border-border/40 pt-2 text-xs font-semibold">
          <div className="flex justify-between">
            <span>{tImpact("totalMonthly")}</span>
            <span className="tabular-nums">
              {tImpact("totalMonthlyValue", {
                amount: formatBillingMonthlyPrice(total, locale),
              })}
            </span>
          </div>
          {options?.showReferralPromo && options.regularTotal != null && options.regularTotal !== total ? (
            <p className="text-right text-[11px] font-normal text-muted-foreground">
              {tManage("referralSummaryDuration", { months: referralPromo?.months ?? 0 })}{" "}
              {tManage("referralSummaryThenRegular", {
                amount: formatBillingMonthlyPrice(options.regularTotal, locale),
              })}
            </p>
          ) : null}
        </div>
      </>
    );
  }

  const isIncrease = recurringDeltaCents > 0;
  const isDecrease = recurringDeltaCents < 0;
  const hasDelta = recurringDeltaCents !== 0;

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm sm:p-4">
      <div className="rounded-lg border border-border/60 bg-card px-4 py-3 dark:border-blue-500/15 dark:bg-blue-950/15">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-5">
          {hasDelta ? (
            <div className="text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {tImpact("currently")}
              </p>
              <p className="text-lg font-semibold tabular-nums text-muted-foreground line-through decoration-muted-foreground/50">
                {formatBillingMonthlyPrice(currentTotal, locale)}
              </p>
            </div>
          ) : null}

          {hasDelta ? (
            <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground/60 sm:block" aria-hidden />
          ) : null}

          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground">{tManage("newSubscription")}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {formatBillingMonthlyPrice(afterTotal, locale)}
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">/ {perMonth}</span>
            </p>
            {referralPromo ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tManage("referralSummaryDuration", { months: referralPromo.months })}{" "}
                {tManage("referralSummaryThenRegular", {
                  amount: formatBillingMonthlyPrice(afterTotalRegular, locale),
                })}
              </p>
            ) : null}
            {hasDelta ? (
              <p
                className={cn(
                  "mt-0.5 text-sm font-semibold tabular-nums",
                  isIncrease && "text-emerald-500",
                  isDecrease && "text-amber-500",
                )}
              >
                ({formatSignedBillingAmount(recurringDeltaCents, locale)} / {perMonth})
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <SummaryColumn title={tImpact("currently")}>
          {renderLineItems(currentPlan, currentLineItems, currentTotal)}
        </SummaryColumn>

        <SummaryColumn title={tImpact("afterChange")}>
          {renderLineItems(targetPlan, afterLineItems, afterTotal, {
            lineItemsRegular: afterLineItemsRegular,
            showReferralPromo: referralPromo != null,
            regularTotal: afterTotalRegular,
          })}
        </SummaryColumn>

        <SummaryColumn title={tManage("impactColumnTitle")}>
          {impactPanel}
        </SummaryColumn>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/40 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-blue-400/80" aria-hidden />
          {continueHint}
        </p>
        <Button
          className="h-10 shrink-0 gap-2 sm:min-w-[180px]"
          disabled={continueDisabled}
          onClick={onContinue}
        >
          {continuePending ? <Loader2 className="size-4 animate-spin" /> : null}
          {continueLabel}
          {!continuePending ? <ArrowRight className="size-4" aria-hidden /> : null}
        </Button>
      </div>
    </div>
  );
}

function SummaryColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-lg border border-border/60 bg-card p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold tracking-tight">{title}</p>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

function PlanChangeImpactDetails({
  impact,
  column = false,
}: {
  impact: PlanImpactSummary;
  column?: boolean;
}) {
  const tManage = useTranslations("billing.workspace.manage");

  const { gains, losses } = splitLimitImpacts(impact.limitImpacts);
  const removedAddons = impact.addonImpacts.filter((row) => row.status === "removed");

  const hasLosses = losses.length > 0 || removedAddons.length > 0;
  const hasGains = gains.length > 0;

  return (
    <div className="space-y-3">
      {!column ? (
        <p className="text-sm font-semibold">{tManage("afterPlanChange")}</p>
      ) : null}

      {impact.timing.kind === "scheduled" ? (
        <p className="text-xs text-muted-foreground">
          {tManage("effectiveFrom", {
            date: formatLongDate(impact.timing.effectiveAt),
          })}
        </p>
      ) : null}

      {hasGains ? (
        <ImpactListSection title={tManage("youWillGain")} variant="gain" compact={column}>
          {gains.map((row) => (
            <LimitImpactLine key={row.key} row={row} variant="gain" compact={column} />
          ))}
        </ImpactListSection>
      ) : null}

      {hasLosses ? (
        <ImpactListSection title={tManage("youWillLose")} variant="loss" compact={column}>
          {losses.map((row) => (
            <LimitImpactLine key={row.key} row={row} variant="loss" compact={column} />
          ))}
          {removedAddons.map((row) => (
            <AddonRemovedLine key={row.key} row={row} compact={column} />
          ))}
        </ImpactListSection>
      ) : null}

      <ImpactListSection title={tManage("youWillKeep")} variant="keep" compact={column}>
        <li className={cn("flex gap-1.5 text-muted-foreground", column ? "text-xs" : "text-sm")}>
          <Check
            className={cn("mt-0.5 shrink-0 text-emerald-500", column ? "size-3" : "size-3.5")}
            aria-hidden
          />
          {tManage("keep.files")}
        </li>
        {impact.addonImpacts.some((row) => row.key === "storage" && row.quantityAfter > 0) ? (
          <li className={cn("flex gap-1.5 text-muted-foreground", column ? "text-xs" : "text-sm")}>
            <Check
              className={cn("mt-0.5 shrink-0 text-emerald-500", column ? "size-3" : "size-3.5")}
              aria-hidden
            />
            {tManage("keep.storagePacks")}
          </li>
        ) : null}
        <li className={cn("flex gap-1.5 text-muted-foreground", column ? "text-xs" : "text-sm")}>
          <Check
            className={cn("mt-0.5 shrink-0 text-emerald-500", column ? "size-3" : "size-3.5")}
            aria-hidden
          />
          {tManage("keep.history")}
        </li>
      </ImpactListSection>
    </div>
  );
}

function AddonChangeImpactDetails({
  impact,
  showUnchanged = false,
  column = false,
}: {
  impact: PlanImpactSummary;
  showUnchanged?: boolean;
  column?: boolean;
}) {
  const tManage = useTranslations("billing.workspace.manage");
  const { gains, losses } = splitLimitImpacts(impact.limitImpacts);
  const gainRows = gains.filter((row) => ["storage", "users"].includes(row.key));
  const lossRows = losses.filter((row) => ["storage", "users"].includes(row.key));

  return (
    <div className="space-y-3">
      {gainRows.length > 0 ? (
        <ImpactListSection title={tManage("youWillGain")} variant="gain" compact={column}>
          {gainRows.map((row) => (
            <LimitImpactLine key={row.key} row={row} variant="gain" compact={column} />
          ))}
        </ImpactListSection>
      ) : null}

      {lossRows.length > 0 ? (
        <ImpactListSection title={tManage("youWillLose")} variant="loss" compact={column}>
          {lossRows.map((row) => (
            <LimitImpactLine key={row.key} row={row} variant="loss" compact={column} />
          ))}
        </ImpactListSection>
      ) : null}

      {showUnchanged ? (
        <ImpactListSection title={tManage("unchangedItems")} variant="keep" compact={column}>
          <li className={cn("flex gap-1.5 text-muted-foreground", column ? "text-xs" : "text-sm")}>
            <Check
              className={cn("mt-0.5 shrink-0 text-emerald-500", column ? "size-3" : "size-3.5")}
              aria-hidden
            />
            {tManage("keep.files")}
          </li>
          <li className={cn("flex gap-1.5 text-muted-foreground", column ? "text-xs" : "text-sm")}>
            <Check
              className={cn("mt-0.5 shrink-0 text-emerald-500", column ? "size-3" : "size-3.5")}
              aria-hidden
            />
            {tManage("keep.history")}
          </li>
        </ImpactListSection>
      ) : null}
    </div>
  );
}

function ImpactListSection({
  title,
  variant,
  compact = false,
  children,
}: {
  title: string;
  variant: "gain" | "loss" | "keep";
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p
        className={cn(
          compact ? "text-[11px] font-semibold uppercase tracking-wide" : "text-sm font-medium",
          variant === "gain" && "text-emerald-600 dark:text-emerald-400",
          variant === "loss" && "text-amber-700 dark:text-amber-300",
          variant === "keep" && "text-muted-foreground",
        )}
      >
        {title}
      </p>
      <ul className={cn("space-y-1", compact && "text-xs leading-snug")}>{children}</ul>
    </div>
  );
}

function LimitImpactLine({
  row,
  variant,
  compact = false,
}: {
  row: LimitImpactRow;
  variant: "gain" | "loss";
  compact?: boolean;
}) {
  const tImpact = useTranslations("billing.workspace.impactSummary");
  const isGain = variant === "gain";
  const iconClass = compact ? "size-3" : "size-3.5";

  return (
    <li
      className={cn(
        "flex items-start gap-1.5",
        compact ? "text-xs text-muted-foreground" : "text-sm",
        !compact && isGain && "text-emerald-800 dark:text-emerald-200",
        !compact && !isGain && "text-amber-900 dark:text-amber-100",
      )}
    >
      {isGain ? (
        <Check className={cn("mt-0.5 shrink-0 text-emerald-500", iconClass)} aria-hidden />
      ) : (
        <X className={cn("mt-0.5 shrink-0 text-amber-600 dark:text-amber-400", iconClass)} aria-hidden />
      )}
      <span>
        {tImpact(`limits.${row.key}`)}: {row.beforeLabel} → {row.afterLabel}
      </span>
    </li>
  );
}

function AddonRemovedLine({ row, compact = false }: { row: AddonImpactRow; compact?: boolean }) {
  const tImpact = useTranslations("billing.workspace.impactSummary");
  const iconClass = compact ? "size-3" : "size-3.5";

  return (
    <li
      className={cn(
        "flex items-start gap-1.5",
        compact ? "text-xs text-muted-foreground" : "text-sm text-amber-900 dark:text-amber-100",
      )}
    >
      <X className={cn("mt-0.5 shrink-0 text-amber-600 dark:text-amber-400", iconClass)} aria-hidden />
      <span>
        {tImpact(`addonImpact.removed`, {
          key: tImpact(`addonKeys.${row.key}`),
          before: row.quantityBefore,
          after: 0,
        })}
      </span>
    </li>
  );
}
