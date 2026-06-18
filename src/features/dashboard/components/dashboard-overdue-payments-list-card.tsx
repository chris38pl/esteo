"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DashboardPanelCard } from "@/features/dashboard/components/dashboard-panel-card";
import { DashboardOverdueDueLabel } from "@/features/dashboard/components/dashboard-overdue-due-label";
import type { DashboardOverduePaymentItem } from "@/features/dashboard/lib/dashboard-overview-types";
import { formatCurrency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";

interface DashboardOverduePaymentsListCardProps {
  items: DashboardOverduePaymentItem[];
  workspaceSlug: string;
  locale: Locale;
}

export function DashboardOverduePaymentsListCard({
  items,
  workspaceSlug,
  locale,
}: DashboardOverduePaymentsListCardProps) {
  const t = useTranslations("dashboard.overview.overdueList");
  const paymentsHref = `/${locale}/dashboard/${workspaceSlug}/payments`;

  return (
    <DashboardPanelCard
      title={t("title")}
      footer={
        <Button variant="outline" className="w-full" asChild>
          <Link href={paymentsHref}>{t("footer")}</Link>
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((item) => {
            const estimateHref = `/${locale}/dashboard/${workspaceSlug}/estimates/${item.estimateId}?tab=payments`;

            return (
              <li key={item.id}>
                <Link
                  href={estimateHref}
                  className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-accent/30"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.estimateTitle}
                    </p>
                    {item.customerName ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.customerName}
                      </p>
                    ) : null}
                    <DashboardOverdueDueLabel dueDate={item.dueDate} locale={locale} />
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(item.amount, locale, item.currency)}
                    </p>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanelCard>
  );
}
