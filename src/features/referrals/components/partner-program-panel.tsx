"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Copy } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReferralShareButton } from "@/features/referrals/components/referral-share-button";
import { buildReferralLink } from "@/features/referrals/lib/referral-share-templates";
import type { ReferralPayoutStatusKey } from "@/features/referrals/lib/referral-payout-status";
import type { PartnerTier } from "@/features/referrals/lib/referral-partner-tier";
import { formatBillingMonthlyPrice } from "@/features/billing/lib/format-billing-amount";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type PageData = NonNullable<
  Awaited<ReturnType<typeof import("@/features/referrals/server/get-partner-program-page-data").getPartnerProgramPageData>>
>;

type Props = {
  locale: Locale;
  workspaceId: string;
  workspaceSlug: string;
  data: PageData;
  showClaimForm?: boolean;
  onClaim?: (emailOrCode: string) => Promise<{ success: boolean; error?: string; code?: string }>;
};

function tierLabel(t: ReturnType<typeof useTranslations>, tier: PartnerTier): string {
  switch (tier) {
    case "BRONZE":
      return t("tier.bronze");
    case "SILVER":
      return t("tier.silver");
    case "GOLD":
      return t("tier.gold");
    case "DIAMOND":
      return t("tier.diamond");
    default:
      return t("tier.none");
  }
}

function CopyField({
  label,
  value,
  copyLabel,
  copiedLabel,
  disabled,
}: {
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md border bg-muted/40 px-3 py-2 text-sm">
          {value}
        </code>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }}
        >
          <Copy className="h-4 w-4" />
          <span className="sr-only">{copied ? copiedLabel : copyLabel}</span>
        </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-4", highlight && "border-primary/30 bg-primary/5")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tracking-tight", highlight && "text-primary")}>
        {value}
      </p>
    </div>
  );
}

export function PartnerProgramPanel({
  locale,
  workspaceId,
  workspaceSlug,
  data,
  showClaimForm = false,
  onClaim,
}: Props) {
  const t = useTranslations("referrals");
  const [claimInput, setClaimInput] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const { profile, canGenerateReferrals, summary, tierProgress, referrals } = data;
  const link = buildReferralLink(locale, profile.code);

  function formatAmount(cents: number): string {
    return formatBillingMonthlyPrice(cents, locale);
  }

  function payoutLabel(key: ReferralPayoutStatusKey, rewardCents: number): string {
    if (key === "bonus_granted") {
      return t("payoutStatus.bonus_granted", { amount: formatAmount(rewardCents) });
    }
    return t(`payoutStatus.${key}`);
  }

  function handleClaimSubmit() {
    if (!onClaim || !claimInput.trim()) {
      return;
    }
    setClaimError(null);
    setClaimSuccess(false);
    startTransition(async () => {
      const result = await onClaim(claimInput.trim());
      if (result.success) {
        setClaimSuccess(true);
        setClaimInput("");
      } else {
        const code = result.code as keyof typeof import("@/messages/pl/referrals.json")["claim"]["errors"] | undefined;
        setClaimError(code ? t(`claim.errors.${code}`) : result.error ?? t("claim.errors.NOT_FOUND"));
      }
    });
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </header>

      {!canGenerateReferrals ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t("inactiveBanner")}</p>
        </div>
      ) : null}

      <section className="space-y-4 rounded-xl border p-5">
        <h2 className="text-lg font-medium">{t("share.title")}</h2>
        <div className="grid gap-4 md:grid-cols-1">
          <CopyField
            label={`1. ${t("share.linkLabel")}`}
            value={link}
            copyLabel={t("share.copy")}
            copiedLabel={t("share.copied")}
            disabled={!canGenerateReferrals}
          />
          <CopyField
            label={`2. ${t("share.emailLabel")}`}
            value={profile.email}
            copyLabel={t("share.copy")}
            copiedLabel={t("share.copied")}
            disabled={!canGenerateReferrals}
          />
          <CopyField
            label={`3. ${t("share.codeLabel")}`}
            value={profile.code}
            copyLabel={t("share.copy")}
            copiedLabel={t("share.copied")}
            disabled={!canGenerateReferrals}
          />
        </div>
        <ReferralShareButton code={profile.code} locale={locale} disabled={!canGenerateReferrals} />
      </section>

      <section className="space-y-4">
        <StatCard label={t("hero.earned")} value={formatAmount(summary.earnedCents)} highlight />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t("hero.pendingBonuses")} value={formatAmount(summary.pendingCents)} />
          <StatCard label={t("hero.appliedToInvoices")} value={formatAmount(summary.appliedCents)} />
          <StatCard label={t("hero.availableBalance")} value={formatAmount(summary.availableBalanceCents)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label={t("hero.activeClients")}
            value={String(summary.activeReferralCount)}
          />
          <StatCard
            label={t("hero.referredMrr")}
            value={formatAmount(summary.activeMrrCents)}
          />
        </div>
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="text-lg font-medium">{t("tier.title")}</h2>
        <p className="mt-2 text-2xl font-semibold">{tierLabel(t, summary.tier)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("tier.activeCount", { count: summary.activeReferralCount })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("tier.lifetimeCount", { count: summary.lifetimeReferralCount })}
        </p>
        {tierProgress.nextTier && tierProgress.nextThreshold ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("tier.nextTier", {
              tier: tierLabel(t, tierProgress.nextTier),
              remaining: tierProgress.nextThreshold - tierProgress.activeCount,
            })}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">{t("table.title")}</h2>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("table.empty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("table.columns.company")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.columns.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.columns.bonus")}</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{row.workspaceName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {payoutLabel(row.payoutStatusKey, row.rewardCents)}
                    </td>
                    <td className="px-4 py-3">
                      {row.rewardCents > 0
                        ? formatAmount(row.rewardCents)
                        : row.expectedRewardCents
                          ? t("bonus.projected", { amount: formatAmount(row.expectedRewardCents) })
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showClaimForm && onClaim ? (
        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="text-lg font-medium">{t("claim.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("claim.description")}</p>
          <p className="text-xs text-muted-foreground">{t("claim.windowHint")}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={claimInput}
              onChange={(e) => setClaimInput(e.target.value)}
              placeholder={t("claim.placeholder")}
              disabled={pending}
            />
            <Button type="button" onClick={handleClaimSubmit} disabled={pending || !claimInput.trim()}>
              {t("claim.submit")}
            </Button>
          </div>
          {claimSuccess ? (
            <p className="text-sm text-emerald-600">{t("claim.success")}</p>
          ) : null}
          {claimError ? <p className="text-sm text-destructive">{claimError}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
