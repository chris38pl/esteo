"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { BillingCatalogPriceMismatchBanner } from "@/features/billing/components/billing-catalog-price-mismatch-banner";
import { BillingHandoffBanner } from "@/features/billing/components/billing-handoff-banner";
import { BillingPlanHeroBanner } from "@/features/billing/components/billing-plan-hero-banner";
import { BillingSecondaryCardsSection } from "@/features/billing/components/billing-secondary-cards-section";
import { BillingUsageStatsSection } from "@/features/billing/components/billing-usage-stats-section";
import {
  cancelWorkspaceSubscriptionAction,
  openWorkspacePortalAction,
  reactivateWorkspaceSubscriptionAction,
} from "@/features/billing/server/billing-actions";
import type { WorkspaceBillingPageData } from "@/features/billing/billing-page-data";
import { formatBillingMonthlyPrice } from "@/features/billing/lib/format-billing-amount";
import { dashboardBillingPlansHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import type { WorkspaceEffectiveStatus } from "@/server/permissions/domain";
import { cn } from "@/lib/utils";

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  data: WorkspaceBillingPageData;
};

const STATUS_NOTICE_STATUSES = [
  "PAST_DUE",
  "GRACE_PERIOD",
  "EXPIRED",
  "ARCHIVED",
  "INCOMPLETE",
  "SUSPENDED",
] as const satisfies readonly WorkspaceEffectiveStatus[];

type StatusNoticeStatus = (typeof STATUS_NOTICE_STATUSES)[number];

function isStatusNoticeStatus(status: string): status is StatusNoticeStatus {
  return (STATUS_NOTICE_STATUSES as readonly string[]).includes(status);
}

function formatPeriodEndDate(value: Date | string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(value));
}

export function WorkspaceBillingPanel({ workspaceId, workspaceSlug, locale, data }: Props) {
  const t = useTranslations("billing.workspace");
  const {
    entitlements,
    pricing,
    cancelAtPeriodEnd,
    currentPeriodEnd,
    storageOverLimit,
    seatOverLimit,
    canManageBilling,
    canChangePlanOrAddons,
    canPurchaseSubscription,
    canResumeSubscription,
    billingOwnershipState,
  } = data;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const plansHref = dashboardBillingPlansHref(locale, workspaceSlug);

  const notice = isStatusNoticeStatus(entitlements.effectiveStatus)
    ? t(`statusNotice.${entitlements.effectiveStatus}`)
    : null;

  const periodEndLabel = currentPeriodEnd ? formatPeriodEndDate(currentPeriodEnd) : null;

  const scheduledCancelNotice =
    cancelAtPeriodEnd && currentPeriodEnd
      ? t("statusNotice.cancelAtPeriodEnd", {
          date: formatPeriodEndDate(currentPeriodEnd),
        })
      : null;

  function run(
    action: () => Promise<
      | { success: true; data: { url: string } | { ok: true } }
      | { success: false; error: string }
    >,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error);
        return;
      }
      if ("url" in result.data) {
        window.location.href = result.data.url;
      } else {
        window.location.reload();
      }
    });
  }

  const monthlyPriceLabel = formatBillingMonthlyPrice(
    pricing.addonCents > 0 ? pricing.recurringCents : pricing.planCents,
    locale,
    pricing.currency,
  );
  const monthlyPriceSubtitle =
    pricing.addonCents > 0 ? t("planHero.priceWithAddons") : null;

  return (
    <div className="space-y-8">
      {notice ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          {notice}
        </div>
      ) : null}

      {storageOverLimit ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          {t("banners.storageOverLimit")}
        </div>
      ) : null}

      {seatOverLimit ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          {t("banners.seatOverLimit")}
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

      {canManageBilling && pricing.catalogPriceMismatch ? (
        <BillingCatalogPriceMismatchBanner pricing={pricing} />
      ) : null}

      <BillingPlanHeroBanner
        plan={entitlements.plan}
        effectiveStatus={entitlements.effectiveStatus}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
        currentPeriodEnd={currentPeriodEnd}
        monthlyPriceLabel={monthlyPriceLabel}
        monthlyPriceSubtitle={monthlyPriceSubtitle}
        pending={pending}
        plansHref={plansHref}
        canManageBilling={canManageBilling || canPurchaseSubscription}
        onManageBilling={() => run(() => openWorkspacePortalAction(workspaceId, locale))}
      />

      <BillingUsageStatsSection data={data} />

      <BillingSecondaryCardsSection
        data={data}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        canManageAddons={canChangePlanOrAddons}
        canManageBilling={canManageBilling}
      />

      {entitlements.plan !== "FREE" && canManageBilling ? (
        <BillingDangerZone
          cancelAtPeriodEnd={cancelAtPeriodEnd}
          canResumeSubscription={canResumeSubscription}
          scheduledCancelNotice={scheduledCancelNotice}
          periodEndLabel={periodEndLabel}
          pending={pending}
          onCancel={() => run(() => cancelWorkspaceSubscriptionAction(workspaceId))}
          onResume={() => run(() => reactivateWorkspaceSubscriptionAction(workspaceId))}
          labels={{
            title: t("dangerZone.title"),
            description: t("dangerZone.description"),
            activeUntilLabel: t("dangerZone.activeUntilLabel"),
            cancelAtPeriodEnd: t("actions.cancelAtPeriodEnd"),
            resumeSubscription: t("actions.resumeSubscription"),
            stripeSecured: t("dangerZone.stripeSecured"),
          }}
        />
      ) : null}
    </div>
  );
}

function BillingDangerZone({
  cancelAtPeriodEnd,
  canResumeSubscription,
  scheduledCancelNotice,
  periodEndLabel,
  pending,
  onCancel,
  onResume,
  labels,
}: {
  cancelAtPeriodEnd: boolean;
  canResumeSubscription: boolean;
  scheduledCancelNotice: string | null;
  periodEndLabel: string | null;
  pending: boolean;
  onCancel: () => void;
  onResume: () => void;
  labels: {
    title: string;
    description: string;
    activeUntilLabel: string;
    cancelAtPeriodEnd: string;
    resumeSubscription: string;
    stripeSecured: string;
  };
}) {
  const showResume = cancelAtPeriodEnd && canResumeSubscription;
  const showCancel = !cancelAtPeriodEnd;

  const actionButton = showResume ? (
    <Button
      variant="outline"
      className="h-11 w-full border-border/80 bg-background px-6 text-sm font-medium md:w-full xl:w-auto"
      onClick={onResume}
      disabled={pending}
    >
      {labels.resumeSubscription}
    </Button>
  ) : showCancel ? (
    <Button
      variant="outline"
      className={cn(
        "h-11 w-full border-red-500/50 bg-background px-6 text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-400 md:w-full xl:w-auto",
        "dark:border-red-400/40 dark:text-red-400 dark:hover:bg-red-400/10",
      )}
      onClick={onCancel}
      disabled={pending}
    >
      {labels.cancelAtPeriodEnd}
    </Button>
  ) : null;

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-red-500/25 bg-card p-5 shadow-sm dark:border-red-400/20 sm:p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start xl:items-center">
          {cancelAtPeriodEnd ? (
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground/90">
              {scheduledCancelNotice}
            </p>
          ) : (
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-500 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-400">
                <AlertTriangle className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1.5">
                <h2 className="text-base font-semibold tracking-tight">{labels.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{labels.description}</p>
              </div>
            </div>
          )}

          <div
            className={cn(
              "flex w-full shrink-0 flex-col gap-4",
              cancelAtPeriodEnd
                ? "md:w-auto md:min-w-[12rem] xl:items-end"
                : "md:w-auto md:min-w-[12rem] md:border-l md:pl-6 xl:flex-row xl:items-center xl:gap-8 xl:pl-8",
            )}
          >
            {!cancelAtPeriodEnd && periodEndLabel ? (
              <div className="space-y-1 xl:text-right">
                <p className="text-sm font-medium text-red-500 dark:text-red-400">
                  {labels.activeUntilLabel}
                </p>
                <p className="text-lg font-semibold tracking-tight">{periodEndLabel}</p>
              </div>
            ) : null}

            {actionButton ? <div className="w-full xl:w-auto">{actionButton}</div> : null}
          </div>
        </div>
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        <span>{labels.stripeSecured}</span>
      </p>
    </section>
  );
}
