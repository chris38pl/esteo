"use client";

import type { Issue } from "@prisma/client";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { IssuePriorityBadge } from "@/features/issues/components/issue-priority-badge";
import { IssueStatusBadge } from "@/features/issues/components/issue-status-badge";
import { IssueTypeBadge } from "@/features/issues/components/issue-type-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Locale } from "@/lib/locale";

type IssueListItem = Pick<
  Issue,
  "number" | "title" | "type" | "priority" | "status" | "createdAt"
>;

export function AdminIssuesTable({
  items,
  locale,
}: {
  items: IssueListItem[];
  locale: Locale;
}) {
  const t = useTranslations("issues");

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t("admin.empty")}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.columns.number")}</TableHead>
            <TableHead>{t("admin.columns.title")}</TableHead>
            <TableHead>{t("admin.columns.type")}</TableHead>
            <TableHead>{t("admin.columns.priority")}</TableHead>
            <TableHead>{t("admin.columns.status")}</TableHead>
            <TableHead>{t("admin.columns.createdAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.number}>
              <TableCell className="font-mono text-sm">#{item.number}</TableCell>
              <TableCell>
                <Link
                  href={`/${locale}/dashboard/admin/issues/${item.number}`}
                  className="font-medium hover:underline"
                >
                  {item.title}
                </Link>
              </TableCell>
              <TableCell>
                <IssueTypeBadge label={t(`type.${item.type}`)} />
              </TableCell>
              <TableCell>
                <IssuePriorityBadge priority={item.priority} label={t(`priority.${item.priority}`)} />
              </TableCell>
              <TableCell>
                <IssueStatusBadge status={item.status} label={t(`status.${item.status}`)} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Intl.DateTimeFormat(locale).format(new Date(item.createdAt))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
