"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { SubscriptionPlan } from "@prisma/client";
import {
  ArrowRight,
  Copy,
  Crown,
  Gift,
  HandCoins,
  Share2,
  UserPlus,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appToast } from "@/components/ui/app-toast";
import {
  ReferralAnalyticsEvents,
  trackReferralEvent,
} from "@/features/referrals/lib/referral-analytics";
import { buildReferralLink, buildReferralShareMessage } from "@/features/referrals/lib/referral-share-templates";
import { REFERRAL_INVITE_HERO_IMAGES } from "@/features/referrals/lib/referral-hero-images";
import { expectedRewardForPlan } from "@/features/referrals/server/referral-rewards-catalog";
import { formatBillingMonthlyPrice } from "@/features/billing/lib/format-billing-amount";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { ReferralInvitationListRow } from "@/features/referrals/components/referral-invitation-list-row";

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

function ReferralGiftGlow() {
  return (
    <div className="absolute inset-0 z-0 overflow-visible">
      <div
        className={cn(
          "absolute bottom-[6%] left-1/2 h-[4.125rem] w-[6.5rem] -translate-x-[54%] rotate-[-10deg]",
          "rounded-[42%_58%_62%_38%] bg-blue-500/30 blur-[2.75rem]",
          "dark:bg-blue-400/24 lg:h-[4.75rem] lg:w-[7.25rem] lg:blur-[3.25rem]",
        )}
      />
      <div
        className={cn(
          "absolute bottom-[9%] left-1/2 h-14 w-24 -translate-x-[44%] rotate-[7deg]",
          "rounded-[58%_42%_48%_52%] bg-indigo-400/28 blur-[2.25rem]",
          "dark:bg-sky-400/20 lg:h-16 lg:w-28 lg:blur-[2.75rem]",
        )}
      />
      <div
        className={cn(
          "absolute bottom-[11%] left-1/2 h-10 w-[5.5rem] -translate-x-1/2 rotate-[-4deg]",
          "rounded-[50%_46%_54%_50%] bg-blue-600/32 blur-[1.75rem]",
          "dark:bg-blue-300/26 lg:h-11 lg:w-24 lg:blur-[2rem]",
        )}
      />
      <div
        className={cn(
          "absolute bottom-[13%] left-[34%] h-8 w-16 -rotate-[14deg]",
          "rounded-[45%_55%_50%_50%] bg-blue-500/22 blur-[1.5rem] dark:bg-blue-400/18",
        )}
      />
      <div
        className={cn(
          "absolute bottom-[8%] left-[56%] h-9 w-14 rotate-[11deg]",
          "rounded-[55%_45%_40%_60%] bg-violet-400/18 blur-[1.75rem] dark:bg-blue-300/16",
        )}
      />
    </div>
  );
}

function ReferralGiftIllustration({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none relative h-36 w-32 shrink-0 overflow-visible sm:h-40 sm:w-44 lg:h-48 lg:w-52",
        className,
      )}
    >
      <ReferralGiftGlow />
      <img
        src={REFERRAL_INVITE_HERO_IMAGES.light}
        alt=""
        draggable={false}
        className="relative z-10 h-full w-full object-contain object-center dark:hidden"
      />
      <img
        src={REFERRAL_INVITE_HERO_IMAGES.dark}
        alt=""
        draggable={false}
        className="relative z-10 hidden h-full w-full object-contain object-center dark:block"
      />
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
  onCopied,
}: {
  value: string;
  copyLabel: string;
  copiedLabel: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        onCopied?.();
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
  onCopied,
  mono = true,
  pasteable = false,
}: {
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
  onCopied?: () => void;
  mono?: boolean;
  pasteable?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className={COPY_FIELD_CLASS}>
        {pasteable ? (
          <Input
            readOnly
            value={value}
            onFocus={(event) => event.target.select()}
            className={cn(
              "h-8 min-w-0 flex-1 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0",
              mono && "font-mono",
            )}
          />
        ) : (
          <span className={cn(COPY_VALUE_CLASS, mono && "font-mono")}>{value}</span>
        )}
        <CopyIconButton
          value={value}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
          onCopied={onCopied}
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
    <div className="flex min-h-[9.5rem] flex-col justify-between rounded-xl border border-border/60 bg-card p-6 pb-7 shadow-sm">
      <p className="text-sm leading-snug text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
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

  const { profile, currentPlan, summary, referrals } = data;
  const link = buildReferralLink(locale, profile.code);
  const shareMessage = buildReferralShareMessage(locale, link);
  const billingHref = `/${locale}/dashboard/${workspaceSlug}/billing`;
  const planStyle = planAccent[currentPlan];

  function trackLinkCopied(copyTarget: "link" | "code" | "email") {
    trackReferralEvent(ReferralAnalyticsEvents.linkCopied, {
      workspaceSlug,
      referralCode: profile.code,
      copyTarget,
    });
  }

  function formatAmount(cents: number): string {
    return formatBillingMonthlyPrice(cents, locale);
  }

  const proBonusAmount = formatAmount(expectedRewardForPlan("PRO") ?? 0);
  const businessBonusAmount = formatAmount(expectedRewardForPlan("BUSINESS") ?? 0);

  function formatDate(iso: string | null): string {
    if (!iso) {
      return "-";
    }
    return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  }

  async function handleInviteShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Esteo",
          text: shareMessage,
          url: link,
        });
        trackReferralEvent(ReferralAnalyticsEvents.shareClicked, {
          workspaceSlug,
          referralCode: profile.code,
          method: "native_share",
        });
        return;
      } catch {
        // fall through
      }
    }
    trackReferralEvent(ReferralAnalyticsEvents.shareClicked, {
      workspaceSlug,
      referralCode: profile.code,
      method: "mailto",
    });
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
        appToast.success(t("claim.success"));
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

      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100/60 shadow-sm dark:from-[#070b14] dark:via-[#0a1020] dark:to-[#070b14]">
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-[1] w-[82%] sm:hidden",
            "bg-gradient-to-r from-blue-50 from-[38%] via-blue-50/88 via-[62%] to-transparent",
            "dark:from-[#070b14] dark:from-[34%] dark:via-[#0a1020]/92 dark:via-[58%] dark:to-transparent",
          )}
        />
        <div className="relative flex min-h-[10.5rem] flex-col justify-center p-6 sm:min-h-0 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="relative z-10 max-w-xl space-y-4 pr-[36%] sm:max-w-xl sm:pr-0">
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
              onClick={handleInviteShare}
            >
              <Share2 className="h-4 w-4" />
              {t("inviteCard.cta")}
            </Button>
          </div>
          <ReferralGiftIllustration className="absolute right-1 bottom-1 z-0 sm:relative sm:right-auto sm:bottom-auto sm:z-auto" />
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
            onCopied={() => trackLinkCopied("link")}
          />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{t("referralLink.alternateShare")}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <CopyRow
            label={t("referralLink.codeLabel")}
            value={profile.code}
            copyLabel={t("share.copy")}
            copiedLabel={t("share.copied")}
            onCopied={() => trackLinkCopied("code")}
          />
          <CopyRow
            label={t("referralLink.emailLabel")}
            value={profile.email}
            copyLabel={t("share.copy")}
            copiedLabel={t("share.copied")}
            onCopied={() => trackLinkCopied("email")}
            mono={false}
            pasteable
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("hero.referredCompanies")}
          value={String(summary.referredCompaniesCount)}
        />
        <StatCard label={t("hero.grantedRewards")} value={formatAmount(summary.grantedRewardsCents)} />
        <StatCard label={t("hero.availableBalance")} value={formatAmount(summary.availableBalanceCents)} />
        <StatCard label={t("hero.usedBalance")} value={formatAmount(summary.usedBalanceCents)} />
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
            className="sidebar-scroll overflow-y-auto max-h-[min(28rem,70vh)] md:max-h-[19.5rem]"
          >
            <div className="space-y-3 p-3 md:hidden">
              {referrals.map((row) => (
                <ReferralInvitationListRow
                  key={row.id}
                  row={row}
                  layout="list"
                  formatDate={formatDate}
                  formatAmount={formatAmount}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 border-b border-border/60 bg-card text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium text-muted-foreground sm:px-8">
                      {t("invitations.columns.email")}
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      {t("invitations.columns.status")}
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      {t("invitations.columns.joined")}
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-muted-foreground sm:px-8">
                      {t("invitations.columns.bonus")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((row) => (
                    <ReferralInvitationListRow
                      key={row.id}
                      row={row}
                      layout="table"
                      formatDate={formatDate}
                      formatAmount={formatAmount}
                    />
                  ))}
                </tbody>
              </table>
            </div>
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
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
            />
            <Button type="button" onClick={handleClaimSubmit} disabled={pending || !claimInput.trim()}>
              {pending ? t("claim.claiming") : t("claim.submit")}
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
