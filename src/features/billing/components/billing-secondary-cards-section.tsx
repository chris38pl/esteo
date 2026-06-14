"use client";

import type { ReactNode } from "react";
import { ChevronRight, Coins, FileText, Puzzle, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { WorkspaceBillingPageData } from "@/features/billing/billing-page-data";
import { formatCurrency, formatDate } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type AddonPlaceholder = {
  id: string;
  titleKey: "extraUsers" | "extraStorage";
  packageKey: "extraUsersPackage" | "extraStoragePackage";
  priceKey: "extraUsersPrice" | "extraStoragePrice";
  icon: typeof Users;
  iconBox: string;
  iconColor: string;
};

const placeholderAddons: AddonPlaceholder[] = [
  {
    id: "users",
    titleKey: "extraUsers",
    packageKey: "extraUsersPackage",
    priceKey: "extraUsersPrice",
    icon: Users,
    iconBox: "border-violet-500/25 bg-violet-500/10",
    iconColor: "text-violet-400",
  },
  {
    id: "storage",
    titleKey: "extraStorage",
    packageKey: "extraStoragePackage",
    priceKey: "extraStoragePrice",
    icon: Coins,
    iconBox: "border-orange-500/25 bg-orange-500/10",
    iconColor: "text-orange-400",
  },
];

export function BillingSecondaryCardsSection({ data }: { data: WorkspaceBillingPageData }) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <BillingActiveAddonsCard />
      <BillingNextInvoiceCard nextInvoice={data.nextInvoice} />
    </section>
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
      <header className="mb-5 flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg border",
            iconBoxClassName,
          )}
        >
          <Icon className={cn("size-5", iconClassName)} aria-hidden />
        </div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </header>

      <div className="flex flex-1 flex-col gap-5">{children}</div>

      {footer ? <footer className="mt-6 border-t border-border/50 pt-4">{footer}</footer> : null}
    </article>
  );
}

function BillingActiveAddonsCard() {
  const t = useTranslations("billing.workspace.addons");

  return (
    <BillingCardShell
      icon={Puzzle}
      iconBoxClassName="border-violet-500/25 bg-violet-500/10"
      iconClassName="text-violet-400"
      title={t("title")}
      footer={
        <button
          type="button"
          disabled
          className="inline-flex w-full items-center justify-between text-sm font-medium text-primary/70"
          aria-disabled
        >
          <span>{t("manageAddons")}</span>
          <ChevronRight className="size-4 shrink-0" aria-hidden />
        </button>
      }
    >
      <ul className="space-y-4">
        {placeholderAddons.map((addon) => (
          <BillingAddonPlaceholderRow key={addon.id} addon={addon} />
        ))}
      </ul>
    </BillingCardShell>
  );
}

function BillingAddonPlaceholderRow({ addon }: { addon: AddonPlaceholder }) {
  const t = useTranslations("billing.workspace.addons");
  const Icon = addon.icon;

  return (
    <li className="flex items-start gap-3">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg border",
          addon.iconBox,
        )}
      >
        <Icon className={cn("size-5", addon.iconColor)} aria-hidden />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium leading-snug">{t(addon.titleKey)}</p>
            <p className="text-sm text-muted-foreground">{t(addon.packageKey)}</p>
          </div>
          <span className="shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400">
            {t("activeBadge")}
          </span>
        </div>
        <p className="text-sm font-medium">{t(addon.priceKey)}</p>
      </div>
    </li>
  );
}

function BillingNextInvoiceCard({
  nextInvoice,
}: {
  nextInvoice: WorkspaceBillingPageData["nextInvoice"];
}) {
  const t = useTranslations("billing.workspace.nextInvoice");
  const locale = useLocale() as Locale;

  const hasInvoice = nextInvoice.kind === "invoice";

  return (
    <BillingCardShell
      icon={FileText}
      iconBoxClassName="border-blue-500/25 bg-blue-500/10"
      iconClassName="text-blue-400"
      title={t("title")}
    >
      {hasInvoice ? (
        <div className="space-y-2">
          <p className="text-4xl font-semibold tracking-tight">
            {formatCurrency(nextInvoice.amountCents / 100, locale, nextInvoice.currency)}
          </p>
          <p className="text-lg text-foreground/90">
            {formatDate(nextInvoice.date, locale, { dateStyle: "long" })}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-2xl font-semibold tracking-tight text-muted-foreground">—</p>
          <p className="text-sm text-muted-foreground">{t(`empty.${nextInvoice.reason}`)}</p>
        </div>
      )}

      <p className="mt-auto text-sm leading-relaxed text-muted-foreground">{t("description")}</p>
    </BillingCardShell>
  );
}
