"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { SubscriptionPlan } from "@prisma/client";
import {
  AlertTriangle,
  ArrowRight,
  Coins,
  Copy,
  Crown,
  Gift,
  HandCoins,
  Share2,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildReferralLink, buildReferralShareMessage } from "@/features/referrals/lib/referral-share-templates";
import type { ReferralPayoutStatusKey } from "@/features/referrals/lib/referral-payout-status";
import { expectedRewardForPlan } from "@/features/referrals/server/referral-rewards-catalog";
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

const MAX_VISIBLE_INVITATIONS = 6;
const INVITATION_ROW_HEIGHT_REM = 3.25;

function ReferralGiftIllustration() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative hidden h-36 w-44 shrink-0 sm:block lg:h-40 lg:w-48"
    >
      <div className="absolute right-2 top-2 size-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-600/10 blur-xl" />
      <Sparkles className="absolute right-16 top-0 size-4 text-amber-300/80" />
      <Sparkles className="absolute right-4 top-10 size-3 text-blue-300/70" />
      <Sparkles className="absolute right-24 top-8 size-3 text-violet-300/60" />
      <div className="absolute right-6 top-6 flex size-24 flex-col items-center justify-end">
        <div className="absolute -top-1 left-1/2 h-8 w-10 -translate-x-1/2 rounded-t-lg bg-gradient-to-b from-sky-300 to-blue-500 shadow-lg shadow-blue-500/20">
          <div className="absolute left-1/2 top-0 h-full w-3 -translate-x-1/2 rounded-t-lg bg-sky-200/80" />
          <div className="absolute left-1 top-1/2 h-3 w-8 -translate-y-1/2 rounded-full bg-sky-200/80" />
        </div>
        <div className="relative h-16 w-full rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl shadow-blue-900/30">
          <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 bg-sky-200/90" />
          <div className="absolute left-1/2 top-0 h-full w-3 -translate-x-1/2 bg-sky-200/90" />
        </div>
      </div>
      <Coins className="absolute bottom-2 right-20 size-5 text-amber-400/90" />
      <Coins className="absolute bottom-6 right-8 size-4 text-amber-300/80" />
    </div>
  );
}

const COPY_FIELD_CLASS =
  "flex items-center gap-1 rounded-lg border border-border/60 bg-secondary px-2.5 py-1.5 dark:bg-input";

const COPY_VALUE_CLASS = "min-w-0 flex-1 truncate text-xs";

function CopyIconButton({
  value,
  copyLabel,
  copiedLabel,
  disabled,
}: {
  value: string;
  copyLabel: string;
  copiedLabel: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }}
    >
      <Copy className="h-3.5 w-3.5" />
      <span className="sr-only">{copied ? copiedLabel : copyLabel}</span>
    </Button>
  );
}

function CopyRow({
  label,
  value,
  copyLabel,
  copiedLabel,
  disabled,
  mono = true,
}: {
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
  disabled?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className={COPY_FIELD_CLASS}>
        <span className={cn(COPY_VALUE_CLASS, mono && "font-mono")}>{value}</span>
        <CopyIconButton
          value={value}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function ReferralBenefitsBanner({
  youTitle,
  proAmount,
  businessAmount,
  youFootnote,
  theyTitle,
  theyValue,
  theyDuration,
  theyFootnote,
}: {
  youTitle: string;
  proAmount: string;
  businessAmount: string;
  youFootnote: string;
  theyTitle: string;
  theyValue: string;
  theyDuration: string;
  theyFootnote: string;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10">
            <Users className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium">{youTitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-3xl font-semibold tracking-tight">{proAmount}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">PRO</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              {businessAmount}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              BUSINESS
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{youFootnote}</p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-blue-500/25 bg-blue-500/10">
            <Gift className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm font-medium">{theyTitle}</p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-3xl font-semibold tracking-tight">{theyValue}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {theyDuration}
            </p>
          </div>
          <ArrowRight className="mb-1 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{theyFootnote}</p>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[7.5rem] flex-col justify-between rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function payoutStatusBadgeStyle(
  payoutStatusKey: ReferralPayoutStatusKey,
): "active" | "processing" | "pending" | "inactive" {
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

const planAccent: Record<
  SubscriptionPlan,
  { planText: string; iconWrap: string; icon: string; button: string }
> = {
  FREE: {
    planText: "text-primary",
    iconWrap: "border-border/60 bg-muted/30",
    icon: "text-primary",
    button: "border-primary/30 text-primary hover:bg-primary/10",
  },
  PRO: {
    planText: "text-blue-500 dark:text-blue-400",
    iconWrap: "border-blue-500/25 bg-blue-500/10",
    icon: "text-blue-500 dark:text-blue-400",
    button: "border-blue-500/30 text-blue-600 hover:bg-blue-500/10 dark:text-blue-400",
  },
  BUSINESS: {
    planText: "text-violet-500 dark:text-violet-400",
    iconWrap: "border-violet-500/25 bg-violet-500/10",
    icon: "text-violet-500 dark:text-violet-400",
    button: "border-violet-500/30 text-violet-600 hover:bg-violet-500/10 dark:text-violet-400",
  },
};

export function PartnerProgramPanel({
  locale,
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
  const invitationsRef = useRef<HTMLDivElement>(null);

  const { profile, canGenerateReferrals, currentPlan, summary, referrals } = data;
  const link = buildReferralLink(locale, profile.code);
  const shareMessage = buildReferralShareMessage(locale, link);
  const billingHref = `/${locale}/dashboard/${workspaceSlug}/billing`;
  const planStyle = planAccent[currentPlan];

  function formatAmount(cents: number): string {
    return formatBillingMonthlyPrice(cents, locale);
  }

  const proBonusAmount = formatAmount(expectedRewardForPlan("PRO") ?? 0);
  const businessBonusAmount = formatAmount(expectedRewardForPlan("BUSINESS") ?? 0);

  function formatDate(iso: string | null): string {
    if (!iso) {
      return "—";
    }
    return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  }

  function renderBonus(
    rewardCents: number,
    expectedRewardCents: number | null,
    payoutStatusKey: ReferralPayoutStatusKey,
  ) {
    if (rewardCents > 0) {
      return <span>{formatAmount(rewardCents)}</span>;
    }
    if (payoutStatusKey === "inactive") {
      return <span className="text-muted-foreground">{formatAmount(0)}</span>;
    }
    if (expectedRewardCents != null && expectedRewardCents > 0) {
      return (
        <span className="text-muted-foreground">
          {formatAmount(expectedRewardCents)}{" "}
          <span className="text-xs font-normal">{t("bonus.projectedSuffix")}</span>
        </span>
      );
    }
    return "—";
  }

  async function handleInviteShare() {
    if (!canGenerateReferrals) {
      return;
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Esteo",
          text: shareMessage,
          url: link,
        });
        return;
      } catch {
        // fall through
      }
    }
    const subject = locale === "pl" ? "Polecam Esteo" : "I recommend Esteo";
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareMessage)}`;
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

  const badgeStyles = {
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    processing: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    pending: "border-border/60 bg-muted/40 text-muted-foreground",
    inactive: "border-border/60 bg-muted/20 text-muted-foreground/80",
  };

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

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100/60 shadow-sm dark:from-[#070b14] dark:via-[#0a1020] dark:to-[#070b14]">
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="relative z-10 max-w-xl space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl dark:text-white">
                {t("inviteCard.title")}
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base dark:text-slate-300">
                {t("inviteCard.subtitle")}
              </p>
            </div>
            <Button
              type="button"
              className="h-11 gap-2 bg-primary px-5 text-primary-foreground hover:bg-primary/90"
              disabled={!canGenerateReferrals}
              onClick={handleInviteShare}
            >
              <Share2 className="h-4 w-4" />
              {t("inviteCard.cta")}
            </Button>
          </div>
          <ReferralGiftIllustration />
        </div>
      </section>

      <ReferralBenefitsBanner
        youTitle={t("benefits.youTitle")}
        proAmount={proBonusAmount}
        businessAmount={businessBonusAmount}
        youFootnote={t("benefits.youFootnote", {
          proAmount: proBonusAmount,
          businessAmount: businessBonusAmount,
        })}
        theyTitle={t("benefits.theyTitle")}
        theyValue={t("benefits.theyValue")}
        theyDuration={t("benefits.theyDuration")}
        theyFootnote={t("benefits.theyFootnote")}
      />

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{t("referralLink.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("referralLink.subtitle")}</p>
        </div>

        <div className={COPY_FIELD_CLASS}>
          <span className={cn(COPY_VALUE_CLASS, "font-mono")}>{link}</span>
          <CopyIconButton
            value={link}
            copyLabel={t("share.copy")}
            copiedLabel={t("share.copied")}
            disabled={!canGenerateReferrals}
          />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{t("referralLink.alternateShare")}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <CopyRow
            label={t("referralLink.codeLabel")}
            value={profile.code}
            copyLabel={t("share.copy")}
            copiedLabel={t("share.copied")}
            disabled={!canGenerateReferrals}
          />
          <CopyRow
            label={t("referralLink.emailLabel")}
            value={profile.email}
            copyLabel={t("share.copy")}
            copiedLabel={t("share.copied")}
            disabled={!canGenerateReferrals}
            mono={false}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("hero.earned")} value={formatAmount(summary.earnedCents)} />
        <StatCard label={t("hero.activeReferrals")} value={String(summary.paidReferredCount)} />
        <StatCard label={t("hero.appliedToInvoices")} value={formatAmount(summary.appliedCents)} />
        <StatCard label={t("hero.availableBalance")} value={formatAmount(summary.availableBalanceCents)} />
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold">{t("howItWorks.title")}</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            { icon: UserPlus, title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
            { icon: Users, title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
            { icon: HandCoins, title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-violet-500/25 bg-violet-500/10">
                <Icon className="size-5 text-violet-500 dark:text-violet-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-4 sm:px-8">
          <h2 className="text-lg font-semibold">{t("invitations.title")}</h2>
          {referrals.length > MAX_VISIBLE_INVITATIONS ? (
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => {
                invitationsRef.current?.scrollTo({
                  top: invitationsRef.current.scrollHeight,
                  behavior: "smooth",
                });
              }}
            >
              {t("invitations.seeAll")}
            </button>
          ) : null}
        </div>

        {referrals.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground sm:px-8">{t("invitations.empty")}</p>
        ) : (
          <div
            ref={invitationsRef}
            className="sidebar-scroll overflow-y-auto"
            style={{ maxHeight: `${MAX_VISIBLE_INVITATIONS * INVITATION_ROW_HEIGHT_REM}rem` }}
          >
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 border-b border-border/60 bg-card text-left">
                <tr>
                  <th className="px-6 py-3 font-medium text-muted-foreground sm:px-8">
                    {t("invitations.columns.email")}
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    {t("invitations.columns.status")}
                  </th>
                  <th className="hidden px-4 py-3 font-medium text-muted-foreground sm:table-cell">
                    {t("invitations.columns.joined")}
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground sm:px-8">
                    {t("invitations.columns.bonus")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((row) => {
                  const badgeKey = payoutStatusBadgeStyle(row.payoutStatusKey);

                  return (
                    <tr key={row.id} className="border-b border-border/40 last:border-0">
                      <td className="px-6 py-3.5 sm:px-8">{row.referredEmail}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            badgeStyles[badgeKey],
                          )}
                        >
                          {t(`payoutStatus.${row.payoutStatusKey}`)}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3.5 text-muted-foreground sm:table-cell">
                        {formatDate(row.claimedAt)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium sm:px-8">
                        {renderBonus(row.rewardCents, row.expectedRewardCents, row.payoutStatusKey)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full border",
              planStyle.iconWrap,
            )}
          >
            <Crown className={cn("size-5", planStyle.icon)} />
          </div>
          <div className="space-y-1">
            <p className="font-medium">
              {t("planBanner.yourPlan")}{" "}
              <span className={cn("font-semibold", planStyle.planText)}>{currentPlan}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {t(`planBanner.${currentPlan.toLowerCase() as "free" | "pro" | "business"}.description`)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className={cn("shrink-0 border", planStyle.button)}
          asChild
        >
          <Link href={billingHref}>{t("planBanner.seePlans")}</Link>
        </Button>
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
