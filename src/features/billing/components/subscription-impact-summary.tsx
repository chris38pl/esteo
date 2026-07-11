"use client";

import type { ReactNode } from "react";
import type { SubscriptionPlan } from "@prisma/client";
import { Check, ChevronRight, FileText, Loader2, Percent, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type {
  ActiveSubscriptionChange,
  WorkspaceActiveReferralDiscount,
  WorkspaceBillingNextInvoice,
  WorkspaceBillingPricing,
} from "@/features/billing/billing-page-data";
import {
  formatBillingMonthlyPrice,
  formatSignedBillingAmount,
} from "@/features/billing/lib/format-billing-amount";
import { formatRecurringLineItemLabel } from "@/features/billing/lib/format-recurring-line-item-label";
import type {
  AddonImpactRow,
  AddonQuantities,
  LimitImpactRow,
  RecurringLineItem,
} from "@/features/billing/lib/subscription-impact";
import {
  buildRecurringLineItems,
  computePlanImpactSummary,
  splitLimitImpacts,
} from "@/features/billing/lib/subscription-impact";
import { BillingInvoiceAdjustmentRow } from "@/features/billing/components/billing-invoice-adjustment-row";
import { formatDate } from "@/i18n/formatters";
import { dashboardAccountBillingTabHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type OverviewProps = {
  variant: "overview";
  locale: Locale;
  currentPlan: SubscriptionPlan;
  currentAddons: AddonQuantities;
  pricing: WorkspaceBillingPricing;
  nextInvoice: WorkspaceBillingNextInvoice;
  activeReferralDiscount: WorkspaceActiveReferralDiscount | null;
  activeSubscriptionChange: ActiveSubscriptionChange | null;
  canViewInvoiceHistory: boolean;
  canCancelScheduledChange?: boolean;
  cancelScheduledPending?: boolean;
  onCancelScheduledChange?: () => void;
};

type PlanProps = {
  variant: "plan";
  locale: Locale;
  currentPlan: SubscriptionPlan;
  selectedPlan: Exclude<SubscriptionPlan, "FREE">;
  currentAddons: AddonQuantities;
  currentPeriodEnd: Date | null;
  activeSubscriptionChange: ActiveSubscriptionChange | null;
  children?: ReactNode;
};

type AddonsProps = {
  variant: "addons";
  locale: Locale;
  plan: SubscriptionPlan;
  beforeAddons: AddonQuantities;
  afterAddons: AddonQuantities;
};

export type SubscriptionImpactSummaryProps = OverviewProps | PlanProps | AddonsProps;

function SectionDivider() {
  return <div className="border-t border-border/50 pt-4" />;
}

function ImpactLineItems({
  lineItems,
  totalCents,
  locale,
  currency = "PLN",
  plan,
  planLabels,
}: {
  lineItems: RecurringLineItem[];
  totalCents: number;
  locale: Locale;
  currency?: "PLN" | "EUR";
  plan?: SubscriptionPlan | null;
  planLabels: Record<SubscriptionPlan, string>;
}) {
  const t = useTranslations("billing.workspace.impactSummary");

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5 text-sm">
        {lineItems.map((item) => (
          <li key={`${item.kind}-${item.quantity ?? 0}`} className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              {formatRecurringLineItemLabel(
                item,
                item.kind === "plan" ? (plan ?? null) : null,
                planLabels,
                (key, values) => t(key, values ?? {}),
              )}
            </span>
            <span className="shrink-0 font-medium">
              {formatBillingMonthlyPrice(item.cents, locale, currency)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-2 text-sm">
        <span className="font-medium">{t("totalMonthly")}</span>
        <span className="font-semibold">
          {t("totalMonthlyValue", {
            amount: formatBillingMonthlyPrice(totalCents, locale, currency),
          })}
        </span>
      </div>
    </div>
  );
}

function LimitImpactsList({
  gains,
  losses,
}: {
  gains: LimitImpactRow[];
  losses: LimitImpactRow[];
}) {
  const t = useTranslations("billing.workspace.impactSummary");

  if (gains.length === 0 && losses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {gains.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{t("gainsTitle")}</p>
          <ul className="space-y-1.5 text-sm">
            {gains.map((row) => (
              <li key={row.key} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <Check className="size-3.5 shrink-0 text-emerald-500" aria-hidden />
                <span className="text-muted-foreground">{t(`limits.${row.key}`)}:</span>
                <span>
                  {row.beforeLabel} → {row.afterLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {losses.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t("lossesTitle")}</p>
          <ul className="space-y-1.5 text-sm">
            {losses.map((row) => (
              <li
                key={row.key}
                className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-amber-900 dark:text-amber-100"
              >
                <X className="size-3.5 shrink-0" aria-hidden />
                <span className="text-muted-foreground">{t(`limits.${row.key}`)}:</span>
                <span>
                  {row.beforeLabel} → {row.afterLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function AddonImpactsList({ rows }: { rows: AddonImpactRow[] }) {
  const t = useTranslations("billing.workspace.impactSummary");

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t("addonsTitle")}</p>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {rows.map((row) => (
          <li key={row.key}>
            {t(`addonImpact.${row.status}`, {
              key: t(`addonKeys.${row.key}`),
              before: row.quantityBefore,
              after: row.quantityAfter,
            })}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImpactCardShell({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <article className="flex min-h-full flex-col rounded-xl border border-border/60 bg-card p-5 sm:p-6">
      <div className="flex min-h-0 flex-1 gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center self-start rounded-lg border",
            "border-blue-500/25 bg-blue-500/10",
          )}
        >
          <FileText className="size-5 text-blue-400" aria-hidden />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <div className="mt-5 flex flex-1 flex-col gap-5">{children}</div>
          {footer ? (
            <footer className="mt-5 border-t border-border/50 pt-4">{footer}</footer>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function OverviewSummary(props: OverviewProps) {
  const t = useTranslations("billing.workspace.impactSummary");
  const tHero = useTranslations("billing.workspace.planHero");
  const tNext = useTranslations("billing.workspace.nextInvoice");
  const {
    locale,
    currentPlan,
    currentAddons,
    pricing,
    nextInvoice,
    activeReferralDiscount,
    activeSubscriptionChange,
    canViewInvoiceHistory,
    canCancelScheduledChange,
    cancelScheduledPending,
    onCancelScheduledChange,
  } = props;

  const planLabels = {
    FREE: tHero("planName.FREE"),
    PRO: tHero("planName.PRO"),
    BUSINESS: tHero("planName.BUSINESS"),
  } as Record<SubscriptionPlan, string>;

  const currency = pricing.currency;
  const currentLineItems = buildRecurringLineItems(currentPlan, currentAddons);
  const currentTotal = pricing.recurringCents;
  const hasInvoice = nextInvoice.kind === "invoice";
  const adjustmentKind = hasInvoice ? nextInvoice.adjustmentKind : "none";
  const invoiceDeltaCents = hasInvoice
    ? (nextInvoice.invoiceDeltaCents ?? nextInvoice.amountCents - currentTotal)
    : 0;
  const hasProrationBreakdown =
    adjustmentKind === "proration" && Math.abs(invoiceDeltaCents) > 1;
  const hasReferralBreakdown =
    adjustmentKind === "subscription_discount" && Math.abs(invoiceDeltaCents) > 1;
  const referralBalanceAppliedCents = hasInvoice
    ? (nextInvoice.referralBalanceAppliedCents ?? 0)
    : 0;
  const hasReferralBalanceBreakdown = referralBalanceAppliedCents > 0;
  const showInvoiceBreakdown =
    hasProrationBreakdown || hasReferralBreakdown || hasReferralBalanceBreakdown;
  const referralBalanceTooltip = tNext("referralBalanceCreditTooltip");
  const referralPercent = activeReferralDiscount?.percent ?? 20;
  const monthlyAmount = formatBillingMonthlyPrice(currentTotal, locale, currency);
  const adjustmentTooltip = tNext("adjustmentTooltip", { monthlyAmount });
  const referralDiscountTooltip = activeReferralDiscount
    ? tNext("referralDiscountTooltip", {
        percent: activeReferralDiscount.percent,
        date: formatDate(activeReferralDiscount.endsAt, locale, { dateStyle: "long" }),
        monthlyAmount,
      })
    : tNext("referralDiscountTooltip", {
        percent: referralPercent,
        date: hasInvoice
          ? formatDate(nextInvoice.date, locale, { dateStyle: "long" })
          : "",
        monthlyAmount,
      });
  const invoiceHistoryHref = dashboardAccountBillingTabHref(locale);

  const scheduledTargetPlan =
    activeSubscriptionChange?.type === "PLAN_DOWNGRADE"
      ? activeSubscriptionChange.targetPlan
      : null;
  const scheduledAfterAddons = scheduledTargetPlan
    ? buildRecurringLineItems(scheduledTargetPlan, {
        storage: currentAddons.storage,
        seats: 0,
      })
    : [];

  return (
    <ImpactCardShell
      title={t("overviewTitle")}
      footer={
        canViewInvoiceHistory ? (
          <Link
            href={invoiceHistoryHref}
            className="inline-flex w-full items-center justify-between text-sm font-medium text-primary hover:text-primary/90"
          >
            <span>{tNext("viewInvoiceHistory")}</span>
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </Link>
        ) : (
          <span className="inline-flex w-full items-center justify-between text-sm font-medium text-primary/70">
            <span>{tNext("viewInvoiceHistory")}</span>
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </span>
        )
      }
    >
      {activeSubscriptionChange && scheduledTargetPlan ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">{t("scheduledChangeTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("scheduledChangeDescription", {
              from: planLabels[currentPlan],
              to: planLabels[scheduledTargetPlan],
              date: formatDate(activeSubscriptionChange.effectiveAt, locale, { dateStyle: "long" }),
            })}
          </p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("afterChange")}</p>
            <ImpactLineItems
              lineItems={scheduledAfterAddons}
              totalCents={scheduledAfterAddons.reduce((sum, item) => sum + item.cents, 0)}
              locale={locale}
              currency={currency}
              plan={scheduledTargetPlan}
              planLabels={planLabels}
            />
          </div>
          {canCancelScheduledChange && onCancelScheduledChange ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={cancelScheduledPending}
              onClick={onCancelScheduledChange}
            >
              {cancelScheduledPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("cancelScheduledChange")}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className={cn(activeSubscriptionChange && "border-t border-border/50 pt-4")}>
        <p className="text-sm font-medium text-muted-foreground">{t("currentSubscription")}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("totalMonthlyValue", { amount: monthlyAmount })}
        </p>
        <div className="mt-4">
          <ImpactLineItems
            lineItems={currentLineItems}
            totalCents={currentTotal}
            locale={locale}
            currency={currency}
            plan={currentPlan}
            planLabels={planLabels}
          />
        </div>
      </div>

      <SectionDivider />

      <div>
        <p className="text-sm font-medium text-muted-foreground">{t("nextInvoice")}</p>
        {hasInvoice ? (
          <div className="mt-2 space-y-3">
            <p className="text-xl font-semibold tracking-tight sm:text-2xl">
              {formatBillingMonthlyPrice(nextInvoice.amountCents, locale, nextInvoice.currency)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDate(nextInvoice.date, locale, { dateStyle: "long" })}
            </p>
            {showInvoiceBreakdown ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{tNext("breakdown.composedOf")}</p>
                <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{tNext("breakdown.subscription")}</dt>
                  <dd className="font-medium">{monthlyAmount}</dd>
                </div>
                {hasProrationBreakdown && invoiceDeltaCents > 0 ? (
                  <BillingInvoiceAdjustmentRow
                    label={tNext("breakdown.periodCharge")}
                    amount={formatBillingMonthlyPrice(invoiceDeltaCents, locale, currency)}
                    tooltip={adjustmentTooltip}
                  />
                ) : null}
                {hasProrationBreakdown && invoiceDeltaCents < 0 ? (
                  <BillingInvoiceAdjustmentRow
                    label={tNext("breakdown.periodCredit")}
                    amount={formatBillingMonthlyPrice(
                      Math.abs(invoiceDeltaCents),
                      locale,
                      currency,
                    )}
                    tooltip={adjustmentTooltip}
                  />
                ) : null}
                {hasReferralBreakdown ? (
                  <BillingInvoiceAdjustmentRow
                    label={tNext("breakdown.referralDiscount", { percent: referralPercent })}
                    amount={`-${formatBillingMonthlyPrice(
                      Math.abs(invoiceDeltaCents),
                      locale,
                      currency,
                    )}`}
                    tooltip={referralDiscountTooltip}
                  />
                ) : null}
                {hasReferralBalanceBreakdown ? (
                  <BillingInvoiceAdjustmentRow
                    label={tNext("breakdown.referralBalanceCredit")}
                    amount={`-${formatBillingMonthlyPrice(
                      referralBalanceAppliedCents,
                      locale,
                      currency,
                    )}`}
                    tooltip={referralBalanceTooltip}
                  />
                ) : null}
                </dl>
              </div>
            ) : hasReferralBalanceBreakdown ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {tNext("referralBalanceAppliedHint", {
                  amount: formatBillingMonthlyPrice(
                    referralBalanceAppliedCents,
                    locale,
                    currency,
                  ),
                })}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {tNext(`empty.${nextInvoice.reason}`)}
          </p>
        )}
      </div>

      {hasInvoice ? (
        <>
          <SectionDivider />
          <div className="space-y-2">
            {activeReferralDiscount ? (
              <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <Percent className="size-4 shrink-0" aria-hidden />
                <span>
                  {tNext("referralDiscountActive", {
                    percent: activeReferralDiscount.percent,
                    date: formatDate(activeReferralDiscount.endsAt, locale, {
                      dateStyle: "short",
                    }),
                  })}
                </span>
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              <span>{tNext("upcomingInvoices")} </span>
              <span className="font-medium text-foreground">
                {tNext("recurringMonthlyValue", { amount: monthlyAmount })}
              </span>
            </p>
          </div>
        </>
      ) : null}
    </ImpactCardShell>
  );
}

function PlanSummary(props: PlanProps) {
  const t = useTranslations("billing.workspace.impactSummary");
  const tHero = useTranslations("billing.workspace.planHero");
  const { locale, currentPlan, selectedPlan, currentAddons, currentPeriodEnd, children } = props;

  const planLabels = {
    FREE: tHero("planName.FREE"),
    PRO: tHero("planName.PRO"),
    BUSINESS: tHero("planName.BUSINESS"),
  } as Record<SubscriptionPlan, string>;

  const unlimitedLabel = t("unlimited");
  const impact = computePlanImpactSummary({
    currentPlan,
    targetPlan: selectedPlan,
    currentAddons,
    effectiveAt: currentPeriodEnd,
    unlimitedLabel,
  });

  return (
    <ImpactCardShell title={t("planChangeTitle")}>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{t("currently")}</p>
        <ImpactLineItems
          lineItems={impact.current.lineItems}
          totalCents={impact.current.totalCents}
          locale={locale}
          plan={currentPlan}
          planLabels={planLabels}
        />
      </div>

      <SectionDivider />

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{t("afterChange")}</p>
        <ImpactLineItems
          lineItems={impact.after.lineItems}
          totalCents={impact.after.totalCents}
          locale={locale}
          plan={selectedPlan}
          planLabels={planLabels}
        />
        {impact.recurringDeltaCents !== 0 ? (
          <p className="text-sm font-medium">
            {t("recurringDelta", {
              amount: formatSignedBillingAmount(impact.recurringDeltaCents, locale),
            })}
          </p>
        ) : null}
      </div>

      {impact.limitImpacts.length > 0 ? (
        <>
          <SectionDivider />
          <LimitImpactsList {...splitLimitImpacts(impact.limitImpacts)} />
        </>
      ) : null}

      {impact.addonImpacts.length > 0 ? (
        <>
          <SectionDivider />
          <AddonImpactsList rows={impact.addonImpacts} />
        </>
      ) : null}

      {impact.timing.kind === "scheduled" ? (
        <>
          <SectionDivider />
          <p className="text-sm text-muted-foreground">
            {t("scheduledTiming", {
              date: formatDate(impact.timing.effectiveAt, locale, { dateStyle: "long" }),
            })}
          </p>
        </>
      ) : null}

      {children ? (
        <>
          <SectionDivider />
          {children}
        </>
      ) : null}
    </ImpactCardShell>
  );
}

function AddonsSummary(props: AddonsProps) {
  const t = useTranslations("billing.workspace.impactSummary");
  const tHero = useTranslations("billing.workspace.planHero");
  const { locale, plan, beforeAddons, afterAddons } = props;

  const planLabels = {
    FREE: tHero("planName.FREE"),
    PRO: tHero("planName.PRO"),
    BUSINESS: tHero("planName.BUSINESS"),
  } as Record<SubscriptionPlan, string>;

  const currentLineItems = buildRecurringLineItems(plan, beforeAddons);
  const afterLineItems = buildRecurringLineItems(plan, afterAddons);
  const currentTotal = currentLineItems.reduce((sum, item) => sum + item.cents, 0);
  const afterTotal = afterLineItems.reduce((sum, item) => sum + item.cents, 0);
  const delta = afterTotal - currentTotal;

  return (
    <ImpactCardShell title={t("addonsChangeTitle")}>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{t("currently")}</p>
        <ImpactLineItems
          lineItems={currentLineItems}
          totalCents={currentTotal}
          locale={locale}
          plan={plan}
          planLabels={planLabels}
        />
      </div>

      <SectionDivider />

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{t("afterChange")}</p>
        <ImpactLineItems
          lineItems={afterLineItems}
          totalCents={afterTotal}
          locale={locale}
          plan={plan}
          planLabels={planLabels}
        />
        {delta !== 0 ? (
          <p className="text-sm font-medium">
            {t("recurringDelta", {
              amount: formatSignedBillingAmount(delta, locale),
            })}
          </p>
        ) : null}
      </div>
    </ImpactCardShell>
  );
}

export function SubscriptionImpactSummary(props: SubscriptionImpactSummaryProps) {
  if (props.variant === "overview") {
    return <OverviewSummary {...props} />;
  }
  if (props.variant === "plan") {
    return <PlanSummary {...props} />;
  }
  return <AddonsSummary {...props} />;
}

/** Compact subline for plan cards - recurring total with current add-ons. */
export function PlanCardAddonSubline({
  plan,
  currentAddons,
  locale,
}: {
  plan: SubscriptionPlan;
  currentAddons: AddonQuantities;
  locale: Locale;
}) {
  const t = useTranslations("billing.workspace.impactSummary");

  if (plan === "FREE") {
    return null;
  }

  const lineItems = buildRecurringLineItems(plan, currentAddons);
  const total = lineItems.reduce((sum, item) => sum + item.cents, 0);
  const basePlanOnly = lineItems.length === 1 && lineItems[0]?.kind === "plan";

  if (basePlanOnly) {
    return null;
  }

  return (
    <p className="text-xs text-muted-foreground">
      {t("withCurrentAddons", {
        amount: formatBillingMonthlyPrice(total, locale),
      })}
    </p>
  );
}
