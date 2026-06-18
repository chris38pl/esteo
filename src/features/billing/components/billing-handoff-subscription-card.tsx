"use client";

import type { ReactNode } from "react";
import { UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatDate } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";

function BillingCardShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="flex min-h-full flex-col rounded-xl border border-border/60 bg-card p-5 sm:p-6">
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center self-start rounded-lg border border-blue-500/25 bg-blue-500/10">
          <UserRound className="size-5 text-blue-400" aria-hidden />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <div className="mt-5 flex flex-1 flex-col gap-4 text-sm">{children}</div>
        </div>
      </div>
    </article>
  );
}

export function BillingHandoffSubscriptionCard({
  currentPeriodEnd,
}: {
  currentPeriodEnd: Date | string | null;
}) {
  const t = useTranslations("billing.workspace.handoffSubscription");
  const locale = useLocale() as Locale;

  const periodEndLabel = currentPeriodEnd
    ? formatDate(currentPeriodEnd, locale, { dateStyle: "long" })
    : null;

  return (
    <BillingCardShell title={t("title")}>
      {periodEndLabel ? (
        <div className="space-y-1">
          <p className="text-muted-foreground">{t("activeUntilLabel")}</p>
          <p className="text-lg font-semibold tracking-tight">{periodEndLabel}</p>
        </div>
      ) : null}

      <p className="leading-relaxed text-muted-foreground">{t("expiresAfter")}</p>
      <p className="leading-relaxed text-foreground/90">{t("purchaseAfter")}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("payerFootnote")}</p>
    </BillingCardShell>
  );
}
