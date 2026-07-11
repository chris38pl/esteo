"use client";

import Link from "next/link";
import { FileText, MoreVertical, Paperclip, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EstimateListStatusBadge } from "@/features/estimates/components/estimate-list-status-badge";
import type { EstimatesListPreferences } from "@/features/estimates/hooks/use-estimates-list-preferences";
import { optionalColumnClassName } from "@/features/estimates/hooks/use-estimates-list-preferences";
import type { EstimateListPageItem } from "@/features/estimates/server/list-estimates-page-data";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface EstimateListRowProps {
  estimate: EstimateListPageItem;
  workspaceSlug: string;
  locale: Locale;
  layout?: "table" | "list";
  visibleColumns?: EstimatesListPreferences["visibleColumns"];
}

const iconClassName =
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10";

const listContentMinHeightClass = "min-h-[4.25rem]";

export function EstimateListRow({
  estimate,
  workspaceSlug,
  locale,
  layout = "table",
  visibleColumns = {
    inquiry: true,
    investment: true,
    client: true,
  },
}: EstimateListRowProps) {
  const t = useTranslations("estimates");
  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";
  const href = `/${locale}/dashboard/${workspaceSlug}/estimates/${estimate.id}`;

  const latest = estimate.latestVersion;
  const request = estimate.estimateRequest;
  const ctx = estimate.listContext;
  const grossTotal = latest ? Number(latest.totalGross) : 0;
  const versionStatus = latest?.status;
  const isArchived = latest?.archivedAt != null;
  const updatedAt = latest?.updatedAt ?? estimate.createdAt;

  const formatDate = (value: Date) =>
    new Intl.DateTimeFormat(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(value);

  const formatDateTime = (value: Date) =>
    new Intl.DateTimeFormat(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(value);

  const toCurrency = (code: string): Currency => (code === "EUR" ? "EUR" : "PLN");

  const displayTitle = estimate.title ?? `Estimate ${estimate.id.slice(-6)}`;
  const subline = request?.requestNumber ?? estimate.id.slice(-8).toUpperCase();
  const hasAttachments = estimate.attachmentCount > 0;

  const listTitleCell = (
    <div className="flex min-w-0 items-center gap-3">
      <span className={iconClassName}>
        <FileText className="size-4" />
      </span>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          listContentMinHeightClass,
          !hasAttachments && "justify-center",
        )}
      >
        <p className="line-clamp-2 font-semibold">{displayTitle}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{subline}</p>
        {hasAttachments ? (
          <p className="mt-0.5 flex h-4 items-center gap-1 text-xs text-muted-foreground">
            <Paperclip className="size-3 shrink-0" aria-hidden />
            {t("list.attachmentCount", { count: estimate.attachmentCount })}
          </p>
        ) : null}
      </div>
    </div>
  );

  const titleCell = (linkTitle: boolean) => (
    <div className="flex min-w-0 items-center gap-3">
      <span className={iconClassName}>
        <FileText className="size-4" />
      </span>
      <div className="min-w-0">
        {linkTitle ? (
          <Link
            href={href}
            className="line-clamp-2 font-semibold underline-offset-4 hover:text-primary hover:underline"
          >
            {displayTitle}
          </Link>
        ) : (
          <p className="line-clamp-2 font-semibold">{displayTitle}</p>
        )}
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{subline}</p>
        <p
          className={cn(
            "mt-0.5 flex h-4 items-center gap-1 text-xs text-muted-foreground",
            estimate.attachmentCount === 0 && "invisible",
          )}
          aria-hidden={estimate.attachmentCount === 0}
        >
          <Paperclip className="size-3 shrink-0" aria-hidden />
          {t("list.attachmentCount", {
            count: estimate.attachmentCount > 0 ? estimate.attachmentCount : 1,
          })}
        </p>
      </div>
    </div>
  );

  const valueCell = (
    <p className="font-semibold tabular-nums whitespace-nowrap">
      {formatCurrency(grossTotal, locale, toCurrency(estimate.currency))}
    </p>
  );

  const statusCell = versionStatus ? (
    <EstimateListStatusBadge
      status={isArchived ? "ARCHIVED" : versionStatus}
      label={t(`status.${isArchived ? "ARCHIVED" : versionStatus}`)}
    />
  ) : (
    <span className="text-xs text-muted-foreground">-</span>
  );

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8 shrink-0 rounded-md"
          aria-label={t("list.actions.more")}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={href} className="gap-2">
            <Pencil className="size-4" />
            {t("list.actions.edit")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (layout === "list") {
    return (
      <Link
        href={href}
        aria-label={t("list.actions.edit")}
        className="flex min-w-0 items-center gap-3 rounded-lg border border-border/60 px-4 py-4 transition-colors hover:bg-muted/30 active:bg-muted/40 sm:gap-4"
      >
        <div className="min-w-0 flex-1">{listTitleCell}</div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          {valueCell}
          {statusCell}
        </div>
      </Link>
    );
  }

  return (
    <tr className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3">{titleCell(true)}</td>

      <td className={optionalColumnClassName("inquiry", visibleColumns.inquiry)}>
        <p className="truncate font-medium">{request?.requestNumber ?? t("context.empty")}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {request?.createdAt
            ? t("context.createdOn", { date: formatDate(request.createdAt) })
            : t("context.noDate")}
        </p>
      </td>

      <td className={optionalColumnClassName("investment", visibleColumns.investment)}>
        <p className="truncate font-medium">
          {ctx.investmentPropertyType ?? t("context.investmentFallback")}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {[ctx.investmentStreet, ctx.investmentCity].filter(Boolean).join(", ") ||
            t("context.noAddress")}
        </p>
      </td>

      <td className={optionalColumnClassName("client", visibleColumns.client)}>
        <p className="truncate font-medium">
          {ctx.customerName ?? ctx.customerEmail ?? t("context.empty")}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {ctx.customerName && ctx.customerEmail ? ctx.customerEmail : t("context.noEmail")}
        </p>
      </td>

      <td className="hidden px-4 py-3 2xl:table-cell">
        <p className="truncate font-medium tabular-nums">{formatDateTime(updatedAt)}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {t("context.editedBy", {
            user: ctx.updatedByEmail ?? t("context.system"),
          })}
        </p>
      </td>

      <td className="px-4 py-3 text-right">{valueCell}</td>

      <td className="px-4 py-3">{statusCell}</td>

      <td className="px-2 py-3">{actionsMenu}</td>
    </tr>
  );
}
