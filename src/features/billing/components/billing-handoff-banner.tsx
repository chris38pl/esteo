"use client";

import { useTranslations } from "next-intl";

import type { BillingOwnershipState } from "@/features/billing/lib/billing-permissions-logic";

type Props = {
  billingOwnershipState: BillingOwnershipState;
  canManageBilling: boolean;
  canPurchaseSubscription: boolean;
  currentPeriodEnd?: Date | string | null;
};

function formatPeriodEndDate(value: Date | string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(value));
}

export function BillingHandoffBanner({
  billingOwnershipState,
  canManageBilling,
  canPurchaseSubscription,
  currentPeriodEnd,
}: Props) {
  const t = useTranslations("billing.workspace");

  if (billingOwnershipState === "HANDOFF_ACTIVE" && !canManageBilling && currentPeriodEnd) {
    return (
      <div className="rounded-md border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100">
        <p>{t("banners.handoffActive", { date: formatPeriodEndDate(currentPeriodEnd) })}</p>
        <p className="mt-2">{t("banners.handoffCannotManage")}</p>
        <p className="mt-2">{t("banners.handoffAfterExpiration")}</p>
      </div>
    );
  }

  if (billingOwnershipState === "HANDOFF_EXPIRED" && canPurchaseSubscription) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
        <p>{t("banners.handoffExpired")}</p>
        <p className="mt-2">{t("banners.handoffExpiredPurchase")}</p>
      </div>
    );
  }

  if (billingOwnershipState === "HANDOFF_ACTIVE" && canManageBilling && currentPeriodEnd) {
    return (
      <div className="rounded-md border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100">
        <p>
          {t("banners.handoffPayerSubscriptionEnding", {
            date: formatPeriodEndDate(currentPeriodEnd),
          })}
        </p>
        <p className="mt-2 text-xs text-blue-800/90 dark:text-blue-100/80">
          {t("banners.handoffPayerFootnote")}
        </p>
      </div>
    );
  }

  if (
    (billingOwnershipState === "HANDOFF_ACTIVE" || billingOwnershipState === "HANDOFF_EXPIRED") &&
    !canManageBilling &&
    !canPurchaseSubscription
  ) {
    return (
      <div className="rounded-md border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>{t("banners.handoffReadOnly")}</p>
      </div>
    );
  }

  return null;
}
