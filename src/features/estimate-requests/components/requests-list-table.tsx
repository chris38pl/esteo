"use client";

import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  RequestListRow,
  requestListRequestColumnClassName,
} from "@/features/estimate-requests/components/request-list-row";
import type { WorkspaceRequestListItem } from "@/features/estimate-requests/server/workspace-requests";
import type { GenerationConfigurationOptions } from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface RequestsListTableProps {
  requests: WorkspaceRequestListItem[];
  workspaceSlug: string;
  workspaceId: string;
  canCreateEstimate: boolean;
  estimateLimitReached: boolean;
  billingHref: string | null;
  generationConfiguration: GenerationConfigurationOptions;
  locale: Locale;
  footer?: ReactNode;
}

const thClassName =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export function RequestsListTable({
  requests,
  workspaceSlug,
  workspaceId,
  canCreateEstimate,
  estimateLimitReached,
  billingHref,
  generationConfiguration,
  locale,
  footer,
}: RequestsListTableProps) {
  const t = useTranslations("requests");

  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {requests.map((request) => (
          <RequestListRow
            key={request.id}
            request={request}
            workspaceSlug={workspaceSlug}
            workspaceId={workspaceId}
            canCreateEstimate={canCreateEstimate}
            estimateLimitReached={estimateLimitReached}
            billingHref={billingHref}
            generationConfiguration={generationConfiguration}
            locale={locale}
            layout="list"
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr>
              <th className={cn(thClassName, requestListRequestColumnClassName)}>
                {t("list.columns.request")}
              </th>
              <th className={thClassName}>
                <span className="inline-flex items-center gap-1">
                  {t("list.columns.received")}
                  <ArrowDown className="size-3.5" aria-hidden />
                </span>
              </th>
              <th className={cn(thClassName, "max-w-[11rem]")}>{t("list.columns.estimate")}</th>
              <th className={thClassName}>{t("list.columns.status")}</th>
              <th className={`${thClassName} hidden md:table-cell`}>
                {t("list.columns.contact")}
              </th>
              <th className={`${thClassName} hidden lg:table-cell`}>
                {t("list.columns.street")}
              </th>
              <th className={`${thClassName} hidden md:table-cell`}>
                {t("list.columns.city")}
              </th>
              <th className={`${thClassName} hidden xl:table-cell`}>
                {t("list.columns.postalCode")}
              </th>
              <th className={`${thClassName} hidden xl:table-cell`}>
                {t("list.columns.propertyType")}
              </th>
              <th className={`${thClassName} hidden 2xl:table-cell`}>
                {t("list.columns.floorArea")}
              </th>
              <th className={cn(thClassName, "w-12 px-2")}>
                <span className="sr-only">{t("list.actions.more")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <RequestListRow
                key={request.id}
                request={request}
                workspaceSlug={workspaceSlug}
                workspaceId={workspaceId}
                canCreateEstimate={canCreateEstimate}
                estimateLimitReached={estimateLimitReached}
                billingHref={billingHref}
                generationConfiguration={generationConfiguration}
                locale={locale}
                layout="table"
              />
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </>
  );
}
