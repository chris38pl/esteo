"use client";

import Link from "next/link";
import { Inbox, Mail, MapPin, Paperclip, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { RequestStatusBadge } from "@/features/estimate-requests/components/request-status-badge";
import { RequestListRowActions } from "@/features/estimate-requests/components/request-list-row-actions";
import type { WorkspaceRequestListItem } from "@/features/estimate-requests/server/workspace-requests";
import type { GenerationConfigurationOptions } from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface RequestListRowProps {
  request: WorkspaceRequestListItem;
  workspaceSlug: string;
  workspaceId: string;
  canCreateEstimate: boolean;
  estimateLimitReached: boolean;
  billingHref: string | null;
  generationConfiguration: GenerationConfigurationOptions;
  locale: Locale;
  layout?: "table" | "list";
}

const iconClassName =
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10";

const listContentMinHeightClass = "min-h-[4.25rem]";

const cellClassName = "max-w-[12rem] truncate text-muted-foreground";

const estimateCellClassName = "max-w-[11rem] min-w-0";

export const requestListRequestColumnClassName = "min-w-[11rem] w-[11rem] max-w-[14rem]";

function formatFloorArea(value: number | null, locale: Locale): string | null {
  if (value === null) {
    return null;
  }

  const formatted = new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US").format(value);
  return `${formatted} m²`;
}

function displayCell(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : "—";
}

function ContactCell({
  email,
  phone,
}: {
  email: string | null | undefined;
  phone: string | null | undefined;
}) {
  const normalizedEmail = email?.trim() || null;
  const normalizedPhone = phone?.trim() || null;

  if (!normalizedEmail && !normalizedPhone) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="min-w-0 max-w-[12rem]">
      {normalizedEmail ? (
        <p className="truncate" title={normalizedEmail}>
          {normalizedEmail}
        </p>
      ) : null}
      {normalizedPhone ? (
        <p
          className={cn(
            "truncate text-xs text-muted-foreground",
            normalizedEmail && "mt-0.5",
          )}
          title={normalizedPhone}
        >
          {normalizedPhone}
        </p>
      ) : null}
    </div>
  );
}

const mobileInfoIconClassName = "size-3 shrink-0 text-muted-foreground/80";

function MobileInfoRow({
  icon,
  children,
  align = "left",
}: {
  icon: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground",
        align === "right" ? "justify-end" : "min-w-0",
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </p>
  );
}

export function RequestListRow({
  request,
  workspaceSlug,
  workspaceId,
  canCreateEstimate,
  estimateLimitReached,
  billingHref,
  generationConfiguration,
  locale,
  layout = "table",
}: RequestListRowProps) {
  const t = useTranslations("requests");
  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";
  const detailHref = `/${locale}/dashboard/${workspaceSlug}/requests/${request.id}`;

  const displayName =
    request.customerFullName ?? request.customerEmail ?? t("list.unknownClient");
  const requestLabel = request.requestNumber ?? t("list.noRequestNumber");
  const hasAttachments = request.attachmentCount > 0;
  const floorAreaLabel = formatFloorArea(request.floorArea, locale);

  const formatDate = (value: Date) =>
    new Intl.DateTimeFormat(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(value);

  const listTitleCell = (
    <div className="flex min-w-0 items-center gap-3">
      <span className={iconClassName}>
        <Inbox className="size-4" />
      </span>
      <div className={cn("flex min-w-0 flex-1 flex-col", listContentMinHeightClass)}>
        <p className="line-clamp-2 font-semibold">{requestLabel}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{displayName}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
          {formatDate(request.createdAt)}
        </p>
      </div>
    </div>
  );

  const titleCell = (
    <div className="flex min-w-0 items-center gap-3">
      <span className={iconClassName}>
        <Inbox className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={detailHref}
          className="block truncate whitespace-nowrap font-medium underline-offset-4 hover:text-primary hover:underline"
          title={requestLabel}
        >
          {requestLabel}
        </Link>
        <p className="truncate text-xs text-muted-foreground" title={displayName}>
          {displayName}
        </p>
      </div>
    </div>
  );

  const receivedCell = (
    <>
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDate(request.createdAt)}
      </span>
      {hasAttachments ? (
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Paperclip className="size-3" />
          {request.attachmentCount}
        </p>
      ) : null}
    </>
  );

  if (layout === "list") {
    const email = request.customerEmail?.trim() || null;
    const phone = request.customerPhone?.trim() || null;
    const street = request.streetAddress?.trim() || null;
    const cityLine = [request.city?.trim(), request.postalCode?.trim()].filter(Boolean).join(" ") || null;
    const propertyType = request.propertyType?.trim() || null;
    const propertySummary = [propertyType, floorAreaLabel].filter(Boolean).join(" · ") || null;
    const estimateHref = request.estimateId
      ? `/${locale}/dashboard/${workspaceSlug}/estimates/${request.estimateId}`
      : null;

    return (
      <div className="surface-card overflow-hidden rounded-xl border border-border/60">
        <div className="flex items-start gap-2 p-4 pb-0">
          <Link
            href={detailHref}
            className="min-w-0 flex-1 transition-colors hover:opacity-90"
          >
            <div className="flex items-start justify-between gap-3">
              {listTitleCell}
              <div className="flex shrink-0 flex-col items-end gap-1">
                <RequestStatusBadge
                  status={request.status}
                  label={t(`status.${request.status}`)}
                />
                {propertySummary ? (
                  <p className="max-w-[10rem] truncate text-right text-xs text-muted-foreground">
                    {propertySummary}
                  </p>
                ) : null}
              </div>
            </div>
          </Link>
          <RequestListRowActions
            requestId={request.id}
            estimateId={request.estimateId}
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            locale={locale}
            canCreateEstimate={canCreateEstimate}
            estimateLimitReached={estimateLimitReached}
            billingHref={billingHref}
            generationConfiguration={generationConfiguration}
            className="shrink-0"
          />
        </div>

        <Link
          href={detailHref}
          className="block px-4 pb-4 pt-3 transition-colors hover:bg-muted/20 active:bg-muted/30"
        >
          {email || phone || street || cityLine ? (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-0.5">
                {email ? (
                  <MobileInfoRow icon={<Mail className={mobileInfoIconClassName} aria-hidden />}>
                    {email}
                  </MobileInfoRow>
                ) : null}
                {phone ? (
                  <MobileInfoRow icon={<Phone className={mobileInfoIconClassName} aria-hidden />}>
                    {phone}
                  </MobileInfoRow>
                ) : null}
              </div>
              {street || cityLine ? (
                <div className="min-w-0 max-w-[48%] space-y-0.5">
                  {street ? (
                    <MobileInfoRow
                      align="right"
                      icon={<MapPin className={mobileInfoIconClassName} aria-hidden />}
                    >
                      {street}
                    </MobileInfoRow>
                  ) : null}
                  {cityLine ? (
                    <p className="truncate text-right text-xs text-muted-foreground">{cityLine}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </Link>

        <div className="border-t border-border/60 px-4 py-3">
          <p className="text-xs font-medium text-foreground/80">{t("list.createdEstimate")}</p>
          {estimateHref ? (
            <Link
              href={estimateHref}
              className="mt-0.5 block truncate text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {request.estimateTitle ?? t("list.linkedEstimate")}
            </Link>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <tr className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/20">
      <td className={cn("px-4 py-3", requestListRequestColumnClassName)}>{titleCell}</td>
      <td className="px-4 py-3">{receivedCell}</td>
      <td className={cn("px-4 py-3", estimateCellClassName)}>
        {request.estimateId ? (
          <Link
            href={`/${locale}/dashboard/${workspaceSlug}/estimates/${request.estimateId}`}
            className="block truncate text-sm font-medium text-primary underline-offset-4 hover:underline"
            title={request.estimateTitle ?? t("list.linkedEstimate")}
          >
            {request.estimateTitle ?? t("list.linkedEstimate")}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <RequestStatusBadge status={request.status} label={t(`status.${request.status}`)} />
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <ContactCell email={request.customerEmail} phone={request.customerPhone} />
      </td>
      <td className={`hidden px-4 py-3 lg:table-cell ${cellClassName}`}>
        {displayCell(request.streetAddress)}
      </td>
      <td className={`hidden px-4 py-3 md:table-cell ${cellClassName}`}>
        {displayCell(request.city)}
      </td>
      <td className={`hidden px-4 py-3 xl:table-cell ${cellClassName}`}>
        {displayCell(request.postalCode)}
      </td>
      <td className={`hidden px-4 py-3 xl:table-cell ${cellClassName}`}>
        {displayCell(request.propertyType)}
      </td>
      <td className={`hidden px-4 py-3 2xl:table-cell ${cellClassName}`}>
        {displayCell(floorAreaLabel)}
      </td>
      <td className="w-12 px-2 py-3">
        <RequestListRowActions
          requestId={request.id}
          estimateId={request.estimateId}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          locale={locale}
          canCreateEstimate={canCreateEstimate}
          estimateLimitReached={estimateLimitReached}
          billingHref={billingHref}
          generationConfiguration={generationConfiguration}
        />
      </td>
    </tr>
  );
}
