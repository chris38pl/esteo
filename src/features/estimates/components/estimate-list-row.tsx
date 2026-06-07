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
import type { EstimateListPageItem } from "@/features/estimates/server/list-estimates-page-data";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";

interface EstimateListRowProps {
  estimate: EstimateListPageItem;
  workspaceSlug: string;
  locale: Locale;
}

const iconClassName =
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10";

export function EstimateListRow({
  estimate,
  workspaceSlug,
  locale,
}: EstimateListRowProps) {
  const t = useTranslations("estimates");
  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";
  const href = `/${locale}/dashboard/${workspaceSlug}/estimates/${estimate.id}`;

  const latest = estimate.latestVersion;
  const request = estimate.estimateRequest;
  const ctx = estimate.listContext;
  const grossTotal = latest ? Number(latest.totalGross) : 0;
  const versionStatus = latest?.status;
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

  return (
    <tr className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={iconClassName}>
            <FileText className="size-4" />
          </span>
          <div className="min-w-0">
            <Link
              href={href}
              className="line-clamp-2 font-semibold underline-offset-4 hover:text-primary hover:underline"
            >
              {displayTitle}
            </Link>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{subline}</p>
            {estimate.attachmentCount > 0 ? (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Paperclip className="size-3 shrink-0" aria-hidden />
                {t("list.attachmentCount", { count: estimate.attachmentCount })}
              </p>
            ) : null}
          </div>
        </div>
      </td>

      <td className="hidden px-4 py-3 md:table-cell">
        <p className="truncate font-medium">{request?.requestNumber ?? t("context.empty")}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {request?.createdAt
            ? t("context.createdOn", { date: formatDate(request.createdAt) })
            : t("context.noDate")}
        </p>
      </td>

      <td className="hidden px-4 py-3 lg:table-cell">
        <p className="truncate font-medium">
          {ctx.investmentPropertyType ?? t("context.investmentFallback")}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {[ctx.investmentStreet, ctx.investmentCity].filter(Boolean).join(", ") ||
            t("context.noAddress")}
        </p>
      </td>

      <td className="hidden px-4 py-3 xl:table-cell">
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

      <td className="px-4 py-3 text-right">
        <p className="font-semibold tabular-nums whitespace-nowrap">
          {formatCurrency(grossTotal, locale, toCurrency(estimate.currency))}
        </p>
      </td>

      <td className="px-4 py-3">
        {versionStatus ? (
          <EstimateListStatusBadge
            status={versionStatus}
            label={t(`status.${versionStatus}`)}
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      <td className="px-2 py-3">
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
      </td>
    </tr>
  );
}
