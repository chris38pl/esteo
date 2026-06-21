"use client";

import Link from "next/link";
import { Handshake } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { claimReferralAction } from "@/features/referrals/server/referral-actions";
import type { WorkspaceReferralClaimView } from "@/features/referrals/server/get-workspace-referral-claim-view";
import { formatDate } from "@/i18n/formatters";
import { dashboardBillingPlansHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  referralClaim: WorkspaceReferralClaimView | null;
};

function ReferralClaimedCard({
  claim,
  locale,
  workspaceSlug,
}: {
  claim: WorkspaceReferralClaimView;
  locale: Locale;
  workspaceSlug: string;
}) {
  const t = useTranslations("referrals.claim.claimed");
  const referrerLabel =
    claim.referrerName?.trim() || claim.referrerEmail;

  return (
    <section className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10">
          <Handshake className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-medium">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">{t("referrerLabel")}</dt>
          <dd className="mt-0.5 font-medium">{referrerLabel}</dd>
          {claim.referrerName?.trim() ? (
            <dd className="text-muted-foreground">{claim.referrerEmail}</dd>
          ) : null}
        </div>
        <div>
          <dt className="text-muted-foreground">{t("inputLabel")}</dt>
          <dd className="mt-0.5 font-medium font-mono text-[13px]">{claim.inputUsed}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("claimedAt")}</dt>
          <dd className="mt-0.5 font-medium">
            {formatDate(claim.claimedAt, locale, { dateStyle: "long" })}
          </dd>
        </div>
      </dl>

      <p className="text-sm text-muted-foreground">{t("benefitHint")}</p>

      {!claim.hasPaidSubscription ? (
        <div className="space-y-2 border-t border-emerald-500/15 pt-4">
          <p className="text-sm text-emerald-800 dark:text-emerald-200">{t("statusAwaitingPayment")}</p>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={dashboardBillingPlansHref(locale, workspaceSlug)}>{t("viewPlans")}</Link>
          </Button>
        </div>
      ) : (
        <p className="text-sm text-emerald-700 dark:text-emerald-300">{t("statusActive")}</p>
      )}
    </section>
  );
}

export function ReferralClaimSettingsSection({
  workspaceId,
  workspaceSlug,
  locale,
  referralClaim,
}: Props) {
  const t = useTranslations("referrals.claim");
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (referralClaim) {
    return (
      <ReferralClaimedCard claim={referralClaim} locale={locale} workspaceSlug={workspaceSlug} />
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await claimReferralAction(
        { workspaceId, workspaceSlug, emailOrCode: value.trim() },
        locale,
      );
      if (result.success) {
        setValue("");
        router.refresh();
      } else {
        const code = result.code as keyof typeof import("@/messages/pl/referrals.json")["claim"]["errors"] | undefined;
        setError(code ? t(`errors.${code}`) : result.error ?? t("errors.NOT_FOUND"));
      }
    });
  }

  return (
    <section className="space-y-3 rounded-xl border p-5">
      <h2 className="text-base font-medium">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <p className="text-xs text-muted-foreground">{t("windowHint")}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("placeholder")}
          disabled={pending}
        />
        <Button type="button" onClick={submit} disabled={pending || !value.trim()}>
          {t("submit")}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
