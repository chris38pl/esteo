"use client";

import Link from "next/link";
import { Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";

import type { WorkspaceRequestListItem } from "@/features/estimate-requests/server/workspace-requests";
import { RequestStatusBadge } from "@/features/estimate-requests/components/request-status-badge";
import type { Locale } from "@/lib/locale";

interface RequestsListPanelProps {
  requests: WorkspaceRequestListItem[];
  workspaceSlug: string;
  locale: Locale;
}

export function RequestsListPanel({
  requests,
  workspaceSlug,
  locale,
}: RequestsListPanelProps) {
  const t = useTranslations("requests");

  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";
  const formatDate = (value: Date) =>
    new Intl.DateTimeFormat(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(value);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("page.title")}</h1>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("page.empty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">{t("list.columns.request")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("list.columns.status")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("list.columns.location")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("list.columns.estimate")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("list.columns.received")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const displayName =
                  request.customerFullName ?? request.customerEmail ?? t("list.unknownClient");
                const detailHref = `/${locale}/dashboard/${workspaceSlug}/requests/${request.id}`;

                return (
                  <tr
                    key={request.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={detailHref}
                        className="font-medium underline-offset-4 hover:text-primary hover:underline"
                      >
                        {request.requestNumber ?? t("list.noRequestNumber")}
                      </Link>
                      <p className="text-xs text-muted-foreground">{displayName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <RequestStatusBadge
                        status={request.status}
                        label={t(`status.${request.status}`)}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {request.city ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {request.estimateId ? (
                        <Link
                          href={`/${locale}/dashboard/${workspaceSlug}/estimates/${request.estimateId}`}
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {request.estimateTitle ?? t("list.linkedEstimate")}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(request.createdAt)}
                      </span>
                      {request.attachmentCount > 0 ? (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Paperclip className="size-3" />
                          {request.attachmentCount}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
