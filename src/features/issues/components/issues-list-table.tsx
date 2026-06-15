"use client";

import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  IssueListRow,
  issueListIssueColumnClassName,
} from "@/features/issues/components/issue-list-row";
import type { AdminIssueListItem } from "@/features/issues/server/repository";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const thClassName =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export function IssuesListTable({
  issues,
  locale,
  footer,
}: {
  issues: AdminIssueListItem[];
  locale: Locale;
  footer?: ReactNode;
}) {
  const t = useTranslations("issues");

  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {issues.map((issue) => (
          <IssueListRow key={issue.number} issue={issue} locale={locale} layout="list" />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr>
              <th className={cn(thClassName, issueListIssueColumnClassName)}>
                {t("list.columns.issue")}
              </th>
              <th className={thClassName}>
                <span className="inline-flex items-center gap-1">
                  {t("list.columns.createdAt")}
                  <ArrowDown className="size-3.5" aria-hidden />
                </span>
              </th>
              <th className={thClassName}>{t("list.columns.type")}</th>
              <th className={thClassName}>{t("list.columns.priority")}</th>
              <th className={thClassName}>{t("list.columns.status")}</th>
              <th className={cn(thClassName, "hidden md:table-cell")}>
                {t("list.columns.attachments")}
              </th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <IssueListRow key={issue.number} issue={issue} locale={locale} layout="table" />
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </>
  );
}
