"use client";

import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  IssueListRow,
  issueListIssueColumnClassName,
} from "@/features/issues/components/issue-list-row";
import type { IssuesRouteVariant } from "@/features/issues/lib/issues-base-path";
import type { AdminIssueListItem } from "@/features/issues/server/repository";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const thClassName =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export function IssuesListTable({
  issues,
  locale,
  footer,
  issuesVariant = "admin",
  selectedNumbers,
  onToggleIssue,
  onTogglePage,
  pageSelectionState = "none",
}: {
  issues: AdminIssueListItem[];
  locale: Locale;
  footer?: ReactNode;
  issuesVariant?: IssuesRouteVariant;
  selectedNumbers?: Set<number>;
  onToggleIssue?: (number: number, checked: boolean) => void;
  onTogglePage?: (checked: boolean) => void;
  pageSelectionState?: "none" | "some" | "all";
}) {
  const t = useTranslations("issues");
  const selectable = Boolean(selectedNumbers && onToggleIssue && onTogglePage);

  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {issues.map((issue) => (
          <IssueListRow
            key={issue.number}
            issue={issue}
            locale={locale}
            layout="list"
            issuesVariant={issuesVariant}
            selected={selectedNumbers?.has(issue.number) ?? false}
            onSelectedChange={
              onToggleIssue
                ? (checked) => onToggleIssue(issue.number, checked)
                : undefined
            }
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr>
              {selectable ? (
                <th className="w-10 px-3 py-3">
                  <Checkbox
                    checked={
                      pageSelectionState === "all"
                        ? true
                        : pageSelectionState === "some"
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={(checked) => onTogglePage?.(checked === true)}
                    aria-label={t("list.bulk.selectPage")}
                  />
                </th>
              ) : null}
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
              <IssueListRow
                key={issue.number}
                issue={issue}
                locale={locale}
                layout="table"
                issuesVariant={issuesVariant}
                selected={selectedNumbers?.has(issue.number) ?? false}
                onSelectedChange={
                  onToggleIssue
                    ? (checked) => onToggleIssue(issue.number, checked)
                    : undefined
                }
              />
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </>
  );
}
