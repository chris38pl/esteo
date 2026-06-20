"use client";

import type { ReactNode } from "react";
import { ChevronRight, Coins, Puzzle, Users } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import type { WorkspaceBillingPageData } from "@/features/billing/billing-page-data";
import {
  ADDON_UNIT_PRICES_PLN,
  SEAT_UNIT_COUNT,
  STORAGE_UNIT_BYTES,
} from "@/server/billing/addon-catalog";
import { formatBytes } from "@/features/attachments/lib/format-bytes";
import { BillingHandoffSubscriptionCard } from "@/features/billing/components/billing-handoff-subscription-card";
import { SubscriptionImpactSummary } from "@/features/billing/components/subscription-impact-summary";
import { changeWorkspacePlanAction } from "@/features/billing/server/billing-actions";
import { dashboardBillingManageHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function BillingSecondaryCardsSection({
  data,
  workspaceId,
  workspaceSlug,
  canManageAddons,
  canManageBilling,
  canChangePlanOrAddons,
}: {
  data: WorkspaceBillingPageData;
  workspaceId: string;
  workspaceSlug: string;
  canManageAddons: boolean;
  canManageBilling: boolean;
  canChangePlanOrAddons: boolean;
}) {
  const canViewInvoiceHistory = data.entitlements.plan !== "FREE" && canManageBilling;
  const locale = useLocale() as Locale;
  const manageHref = dashboardBillingManageHref(locale, workspaceSlug);
  const showHandoffSubscriptionCard =
    data.billingOwnershipState === "HANDOFF_ACTIVE" && !canManageBilling;

  return (
    <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
      <BillingActiveAddonsCard
        data={data}
        addonsHref={manageHref}
        canManageAddons={canManageAddons}
      />
      {showHandoffSubscriptionCard ? (
        <BillingHandoffSubscriptionCard currentPeriodEnd={data.currentPeriodEnd} />
      ) : (
        <BillingSubscriptionImpactCard
          data={data}
          workspaceId={workspaceId}
          locale={locale}
          canViewInvoiceHistory={canViewInvoiceHistory}
          canCancelScheduledChange={canChangePlanOrAddons}
        />
      )}
    </section>
  );
}

function BillingSubscriptionImpactCard({
  data,
  workspaceId,
  locale,
  canViewInvoiceHistory,
  canCancelScheduledChange,
}: {
  data: WorkspaceBillingPageData;
  workspaceId: string;
  locale: Locale;
  canViewInvoiceHistory: boolean;
  canCancelScheduledChange: boolean;
}) {
  const tPlans = useTranslations("billing.workspace.plans");
  const tHero = useTranslations("billing.workspace.planHero");
  const [cancelPending, startCancelTransition] = useTransition();

  function handleCancelScheduledChange() {
    startCancelTransition(async () => {
      const result = await changeWorkspacePlanAction(workspaceId, data.entitlements.plan);
      if (!result.success) {
        return;
      }
      if (result.data.kind === "downgrade_canceled") {
        toast.success(
          tPlans("downgradeCanceled", { plan: tHero(`planName.${result.data.plan}`) }),
        );
        window.location.reload();
      }
    });
  }

  return (
    <SubscriptionImpactSummary
      variant="overview"
      locale={locale}
      currentPlan={data.entitlements.plan}
      currentAddons={data.addonQuantities}
      pricing={data.pricing}
      nextInvoice={data.nextInvoice}
      activeReferralDiscount={data.activeReferralDiscount}
      activeSubscriptionChange={data.activeSubscriptionChange}
      canViewInvoiceHistory={canViewInvoiceHistory}
      canCancelScheduledChange={canCancelScheduledChange && Boolean(data.activeSubscriptionChange)}
      cancelScheduledPending={cancelPending}
      onCancelScheduledChange={handleCancelScheduledChange}
    />
  );
}

function BillingCardShell({
  icon: Icon,
  iconBoxClassName,
  iconClassName,
  title,
  children,
  footer,
}: {
  icon: typeof Puzzle;
  iconBoxClassName: string;
  iconClassName: string;
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
            iconBoxClassName,
          )}
        >
          <Icon className={cn("size-5", iconClassName)} aria-hidden />
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

function BillingCardFooterLink({
  label,
  href,
  disabled,
  onClick,
}: {
  label: string;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "inline-flex w-full items-center justify-between text-sm font-medium",
    disabled ? "text-primary/70" : "text-primary hover:text-primary/90",
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        <span>{label}</span>
        <ChevronRight className="size-4 shrink-0" aria-hidden />
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={className}
      aria-disabled={disabled}
    >
      <span>{label}</span>
      <ChevronRight className="size-4 shrink-0" aria-hidden />
    </button>
  );
}

function BillingActiveAddonsCard({
  data,
  addonsHref,
  canManageAddons,
}: {
  data: WorkspaceBillingPageData;
  addonsHref: string;
  canManageAddons: boolean;
}) {
  const t = useTranslations("billing.workspace.addons");
  const { entitlements } = data;
  const storageQty = entitlements.addons.storage.quantity;
  const seatQty = entitlements.addons.seats.quantity;
  const hasActiveAddons = storageQty > 0 || seatQty > 0;

  return (
    <BillingCardShell
      icon={Puzzle}
      iconBoxClassName="border-violet-500/25 bg-violet-500/10"
      iconClassName="text-violet-400"
      title={t("title")}
      footer={
        <BillingCardFooterLink
          label={t("manageAddons")}
          href={addonsHref}
          disabled={!canManageAddons}
        />
      }
    >
      {hasActiveAddons ? (
        <ul className="space-y-4">
          {storageQty > 0 ? (
            <BillingAddonRow
              icon={Coins}
              iconBox="border-orange-500/25 bg-orange-500/10"
              iconColor="text-orange-400"
              title={t("extraStorage")}
              packageLabel={t("extraStorageActive", {
                count: storageQty,
                amount: formatBytes(storageQty * STORAGE_UNIT_BYTES),
              })}
              priceLabel={t("extraStoragePrice", {
                amount: storageQty * ADDON_UNIT_PRICES_PLN.STORAGE,
              })}
            />
          ) : null}
          {seatQty > 0 ? (
            <BillingAddonRow
              icon={Users}
              iconBox="border-violet-500/25 bg-violet-500/10"
              iconColor="text-violet-400"
              title={t("extraUsers")}
              packageLabel={t("extraUsersActive", {
                count: seatQty,
                amount: seatQty * SEAT_UNIT_COUNT,
              })}
              priceLabel={t("extraUsersPrice", {
                amount: seatQty * ADDON_UNIT_PRICES_PLN.SEATS,
              })}
            />
          ) : null}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
    </BillingCardShell>
  );
}

function BillingAddonRow({
  icon: Icon,
  iconBox,
  iconColor,
  title,
  packageLabel,
  priceLabel,
}: {
  icon: typeof Users;
  iconBox: string;
  iconColor: string;
  title: string;
  packageLabel: string;
  priceLabel: string;
}) {
  const t = useTranslations("billing.workspace.addons");

  return (
    <li className="flex items-start gap-3">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg border",
          iconBox,
        )}
      >
        <Icon className={cn("size-5", iconColor)} aria-hidden />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium leading-snug">{title}</p>
            <p className="text-sm text-muted-foreground">{packageLabel}</p>
          </div>
          <span className="shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400">
            {t("activeBadge")}
          </span>
        </div>
        <p className="text-sm font-medium">{priceLabel}</p>
      </div>
    </li>
  );
}
