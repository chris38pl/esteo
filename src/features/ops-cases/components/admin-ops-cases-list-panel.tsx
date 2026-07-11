"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { OpsCaseSeverityBadge } from "@/features/ops-cases/components/ops-case-severity-badge";
import { OpsCaseSourceBadge } from "@/features/ops-cases/components/ops-case-source-badge";
import { OpsCaseStatusBadge } from "@/features/ops-cases/components/ops-case-status-badge";
import type { AdminOpsCaseListItem } from "@/features/ops-cases/server/repository";
import type { OpsCaseSummaryCounts } from "@/features/ops-cases/server/repository";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SummaryStrip({ counts }: { counts: OpsCaseSummaryCounts }) {
  const t = useTranslations("ops-cases.admin.summary");

  const items = [
    { label: t("open"), value: counts.openTotal, className: "text-foreground" },
    { label: t("high"), value: counts.highOpen, className: "text-amber-700 dark:text-amber-300" },
    {
      label: t("critical"),
      value: counts.criticalOpen,
      className: "text-red-700 dark:text-red-300",
    },
    {
      label: t("overdue"),
      value: counts.overdueOpen,
      className: "text-orange-700 dark:text-orange-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border/70 bg-card/95 px-4 py-3 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </p>
          <p className={cn("mt-1 text-2xl font-semibold tabular-nums", item.className)}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function AdminOpsCasesListPanel({
  cases,
  summary,
  locale,
}: {
  cases: AdminOpsCaseListItem[];
  summary: OpsCaseSummaryCounts;
  locale: Locale;
}) {
  const t = useTranslations("ops-cases.admin");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return cases;
    }

    return cases.filter((item) => {
      const haystack = [
        String(item.number),
        item.title,
        item.type,
        item.source,
        item.status,
        item.severity,
        item.affectedUserEmail ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [cases, searchQuery]);

  return (
    <div className="mx-auto min-w-0 w-full max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <SummaryStrip counts={summary} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t("list.searchPlaceholder")}
          className="h-10 w-full max-w-md rounded-lg border border-border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring sm:w-80"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t("list.columns.number")}</th>
                <th className="px-4 py-3 font-medium">{t("list.columns.title")}</th>
                <th className="px-4 py-3 font-medium">{t("list.columns.source")}</th>
                <th className="px-4 py-3 font-medium">{t("list.columns.severity")}</th>
                <th className="px-4 py-3 font-medium">{t("list.columns.status")}</th>
                <th className="px-4 py-3 font-medium">{t("list.columns.occurrences")}</th>
                <th className="px-4 py-3 font-medium">{t("list.columns.affectedUser")}</th>
                <th className="px-4 py-3 font-medium">{t("list.columns.createdAt")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    {t("list.empty")}
                  </td>
                </tr>
              ) : (
                filteredCases.map((item) => (
                  <tr key={item.number} className="border-b border-border/40 last:border-b-0">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/${locale}/dashboard/admin/ops-cases/${item.number}`}
                        className="font-medium text-primary hover:underline"
                      >
                        #{item.number}
                      </Link>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <Link
                        href={`/${locale}/dashboard/admin/ops-cases/${item.number}`}
                        className="line-clamp-2 font-medium hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t(`type.${item.type}` as "type.REFERRAL_REWARD_FAILED")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <OpsCaseSourceBadge
                        source={item.source}
                        label={t(`source.${item.source}` as "source.REFERRAL_SERVICE")}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <OpsCaseSeverityBadge
                        severity={item.severity}
                        label={t(`severity.${item.severity}` as "severity.HIGH")}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <OpsCaseStatusBadge
                        status={item.status}
                        label={t(`status.${item.status}` as "status.OPEN")}
                      />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{item.occurrenceCount}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {item.affectedUserEmail ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
