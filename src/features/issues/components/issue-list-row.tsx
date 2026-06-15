"use client";

import Link from "next/link";
import { Bug, Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";

import { IssuePriorityBadge } from "@/features/issues/components/issue-priority-badge";
import { IssueStatusBadge } from "@/features/issues/components/issue-status-badge";
import { IssueTypeBadge } from "@/features/issues/components/issue-type-badge";
import type { AdminIssueListItem } from "@/features/issues/server/repository";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const iconClassName =
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10";

const listContentMinHeightClass = "min-h-[4.25rem]";
const cellClassName = "max-w-[12rem] truncate text-muted-foreground";

export const issueListIssueColumnClassName = "min-w-[11rem] w-[11rem] max-w-[14rem]";

export function IssueListRow({
  issue,
  locale,
  layout = "table",
}: {
  issue: AdminIssueListItem;
  locale: Locale;
  layout?: "table" | "list";
}) {
  const t = useTranslations("issues");
  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";
  const detailHref = `/${locale}/dashboard/admin/issues/${issue.number}`;
  const issueLabel = `#${issue.number}`;
  const hasAttachments = issue.attachmentCount > 0;

  const formatDate = (value: Date | string) =>
    new Intl.DateTimeFormat(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));

  const listTitleCell = (
    <div className="flex min-w-0 items-center gap-3">
      <span className={iconClassName}>
        <Bug className="size-4" />
      </span>
      <div className={cn("flex min-w-0 flex-1 flex-col", listContentMinHeightClass)}>
        <p className="line-clamp-2 font-semibold">{issue.title}</p>
        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{issueLabel}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
          {formatDate(issue.createdAt)}
        </p>
      </div>
    </div>
  );

  const titleCell = (
    <div className="flex min-w-0 items-center gap-3">
      <span className={iconClassName}>
        <Bug className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={detailHref}
          className="block truncate whitespace-nowrap font-medium underline-offset-4 hover:text-primary hover:underline"
          title={issue.title}
        >
          {issue.title}
        </Link>
        <p className="truncate font-mono text-xs text-muted-foreground" title={issueLabel}>
          {issueLabel}
        </p>
      </div>
    </div>
  );

  const createdCell = (
    <>
      <span className="text-xs text-muted-foreground tabular-nums">{formatDate(issue.createdAt)}</span>
      {hasAttachments ? (
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Paperclip className="size-3" />
          {issue.attachmentCount}
        </p>
      ) : null}
    </>
  );

  if (layout === "list") {
    return (
      <div className="surface-card overflow-hidden rounded-xl border border-border/60">
        <Link href={detailHref} className="block p-4 transition-colors hover:bg-accent/20">
          <div className="flex items-start justify-between gap-3">
            {listTitleCell}
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <IssueStatusBadge status={issue.status} label={t(`status.${issue.status}`)} />
              <IssueTypeBadge label={t(`type.${issue.type}`)} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <IssuePriorityBadge
              priority={issue.priority}
              label={t(`priority.${issue.priority}`)}
            />
            {hasAttachments ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Paperclip className="size-3" />
                {issue.attachmentCount}
              </span>
            ) : null}
          </div>
        </Link>
      </div>
    );
  }

  return (
    <tr className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/20">
      <td className={cn("px-4 py-3 align-top", issueListIssueColumnClassName)}>{titleCell}</td>
      <td className="px-4 py-3 align-top">{createdCell}</td>
      <td className="px-4 py-3 align-top">
        <IssueTypeBadge label={t(`type.${issue.type}`)} />
      </td>
      <td className="px-4 py-3 align-top">
        <IssuePriorityBadge priority={issue.priority} label={t(`priority.${issue.priority}`)} />
      </td>
      <td className="px-4 py-3 align-top">
        <IssueStatusBadge status={issue.status} label={t(`status.${issue.status}`)} />
      </td>
      <td className={cn("hidden px-4 py-3 align-top md:table-cell", cellClassName)}>
        {hasAttachments ? issue.attachmentCount : "—"}
      </td>
    </tr>
  );
}
