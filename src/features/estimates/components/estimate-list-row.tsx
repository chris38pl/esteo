"use client";

import Link from "next/link";
import {
  Building2,
  CalendarClock,
  FileText,
  MoreVertical,
  Pencil,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EstimateListContextCell } from "@/features/estimates/components/estimate-list-context-cell";
import type { EstimateListPageItem } from "@/features/estimates/server/list-estimates-page-data";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import type { EstimateVersionStatus } from "@prisma/client";

const versionStatusVariant: Record<
  EstimateVersionStatus,
  "default" | "secondary" | "outline"
> = {
  DRAFT: "secondary",
  SENT: "default",
  ARCHIVED: "outline",
};

interface EstimateListRowProps {
  estimate: EstimateListPageItem;
  workspaceSlug: string;
  locale: Locale;
}

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

  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:gap-4">
      <div className="min-w-[7.5rem] flex-1 shrink-0 basis-32">
        <Link
          href={href}
          className="line-clamp-2 font-medium underline-offset-4 hover:text-primary hover:underline"
        >
          {displayTitle}
        </Link>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {request?.requestNumber ?? t("context.empty")}
        </p>
      </div>

      <div className="hidden min-w-0 items-center gap-6 md:flex lg:gap-7">
        <EstimateListContextCell
          icon={FileText}
          heading={t("context.request")}
          primary={request?.requestNumber ?? t("context.empty")}
          secondary={
            request?.createdAt
              ? t("context.createdOn", { date: formatDate(request.createdAt) })
              : t("context.noDate")
          }
        />

        <EstimateListContextCell
          className="hidden lg:flex"
          icon={Building2}
          heading={t("context.investment")}
          primary={ctx.investmentPropertyType ?? t("context.investmentFallback")}
          secondary={
            [ctx.investmentStreet, ctx.investmentCity].filter(Boolean).join(", ") ||
            t("context.noAddress")
          }
        />

        <EstimateListContextCell
          className="hidden xl:flex"
          icon={User}
          heading={t("context.client")}
          primary={ctx.customerName ?? ctx.customerEmail ?? t("context.empty")}
          secondary={
            ctx.customerName && ctx.customerEmail
              ? ctx.customerEmail
              : t("context.noEmail")
          }
        />

        <EstimateListContextCell
          className="hidden 2xl:flex"
          icon={CalendarClock}
          heading={t("context.lastUpdated")}
          primary={formatDateTime(updatedAt)}
          secondary={t("context.editedBy", {
            user: ctx.updatedByEmail ?? t("context.system"),
          })}
        />
      </div>

      <div className="shrink-0 text-right">
        <p className="font-semibold tabular-nums">
          {formatCurrency(grossTotal, locale, toCurrency(estimate.currency))}
        </p>
      </div>

      <div className="shrink-0">
        {versionStatus ? (
          <Badge variant={versionStatusVariant[versionStatus]}>
            {t(`status.${versionStatus}`)}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

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
    </div>
  );
}
