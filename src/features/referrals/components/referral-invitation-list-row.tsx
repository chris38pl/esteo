"use client";

import type { SubscriptionPlan } from "@prisma/client";
import { useTranslations } from "next-intl";

import type { ReferralPayoutStatusKey } from "@/features/referrals/lib/referral-payout-status";
import { cn } from "@/lib/utils";

export type ReferralInvitationListItem = {
  id: string;
  referredEmail: string;
  referredPlan: SubscriptionPlan | null;
  payoutStatusKey: ReferralPayoutStatusKey;
  claimedAt: string | null;
  rewardCents: number;
  expectedRewardCents: number | null;
};

const referredPlanBadgeStyles: Record<Extract<SubscriptionPlan, "PRO" | "BUSINESS">, string> = {
  PRO: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  BUSINESS: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

const badgeStyles = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  processing: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  pending: "border-border/60 bg-muted/40 text-muted-foreground",
  inactive: "border-border/60 bg-muted/20 text-muted-foreground/80",
} as const;

function ReferredPlanBadge({ plan }: { plan: Extract<SubscriptionPlan, "PRO" | "BUSINESS"> }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        referredPlanBadgeStyles[plan],
      )}
    >
      {plan}
    </span>
  );
}

function payoutStatusBadgeStyle(
  payoutStatusKey: ReferralPayoutStatusKey,
): keyof typeof badgeStyles {
  if (payoutStatusKey === "bonus_granted") {
    return "active";
  }
  if (payoutStatusKey === "inactive") {
    return "inactive";
  }
  if (payoutStatusKey === "processing_bonus") {
    return "processing";
  }
  return "pending";
}

type Props = {
  row: ReferralInvitationListItem;
  layout?: "table" | "list";
  formatDate: (iso: string | null) => string;
  formatAmount: (cents: number) => string;
};

export function ReferralInvitationListRow({
  row,
  layout = "table",
  formatDate,
  formatAmount,
}: Props) {
  const t = useTranslations("referrals");
  const badgeKey = payoutStatusBadgeStyle(row.payoutStatusKey);

  const statusBadge = (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeStyles[badgeKey],
      )}
    >
      {t(`payoutStatus.${row.payoutStatusKey}`)}
    </span>
  );

  const bonusContent = (() => {
    if (row.rewardCents > 0) {
      return <span className="font-medium">{formatAmount(row.rewardCents)}</span>;
    }
    if (row.payoutStatusKey === "inactive") {
      return <span className="text-muted-foreground">{formatAmount(0)}</span>;
    }
    if (row.expectedRewardCents != null && row.expectedRewardCents > 0) {
      return (
        <span className="text-muted-foreground">
          {formatAmount(row.expectedRewardCents)}{" "}
          <span className="text-xs font-normal">{t("bonus.projectedSuffix")}</span>
        </span>
      );
    }
    return <span className="text-muted-foreground">-</span>;
  })();

  if (layout === "list") {
    return (
      <article className="flex min-w-0 flex-col gap-3 rounded-lg border border-border/60 px-4 py-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="min-w-0 truncate text-sm font-semibold text-foreground">
              {row.referredEmail}
            </span>
            {row.referredPlan === "PRO" || row.referredPlan === "BUSINESS" ? (
              <ReferredPlanBadge plan={row.referredPlan} />
            ) : null}
          </div>
          {statusBadge}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("invitations.columns.joined")}
            </p>
            <p className="text-foreground">{formatDate(row.claimedAt)}</p>
          </div>
          <div className="min-w-0 space-y-1 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("invitations.columns.bonus")}
            </p>
            <div>{bonusContent}</div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="px-6 py-3.5 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 truncate">{row.referredEmail}</span>
          {row.referredPlan === "PRO" || row.referredPlan === "BUSINESS" ? (
            <ReferredPlanBadge plan={row.referredPlan} />
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3.5">{statusBadge}</td>
      <td className="px-4 py-3.5 text-muted-foreground">{formatDate(row.claimedAt)}</td>
      <td className="px-6 py-3.5 text-right font-medium sm:px-8">{bonusContent}</td>
    </tr>
  );
}
