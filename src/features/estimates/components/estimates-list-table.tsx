"use client";

import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EstimateListRow } from "@/features/estimates/components/estimate-list-row";
import type { EstimatesListPreferences } from "@/features/estimates/hooks/use-estimates-list-preferences";
import { optionalColumnClassName } from "@/features/estimates/hooks/use-estimates-list-preferences";
import type { EstimateListPageItem } from "@/features/estimates/server/list-estimates-page-data";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface EstimatesListTableProps {
  estimates: EstimateListPageItem[];
  workspaceSlug: string;
  locale: Locale;
  visibleColumns: EstimatesListPreferences["visibleColumns"];
  footer?: ReactNode;
}

const thClassName =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export function EstimatesListTable({
  estimates,
  workspaceSlug,
  locale,
  visibleColumns,
  footer,
}: EstimatesListTableProps) {
  const t = useTranslations("estimates");

  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {estimates.map((estimate) => (
          <EstimateListRow
            key={estimate.id}
            estimate={estimate}
            workspaceSlug={workspaceSlug}
            locale={locale}
            layout="list"
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr>
              <th className={thClassName}>{t("list.columns.estimateName")}</th>
              <th
                className={cn(
                  thClassName,
                  optionalColumnClassName("inquiry", visibleColumns.inquiry, ""),
                )}
              >
                {t("list.columns.inquiry")}
              </th>
              <th
                className={cn(
                  thClassName,
                  optionalColumnClassName("investment", visibleColumns.investment, ""),
                )}
              >
                {t("list.columns.investment")}
              </th>
              <th
                className={cn(
                  thClassName,
                  optionalColumnClassName("client", visibleColumns.client, ""),
                )}
              >
                {t("list.columns.client")}
              </th>
              <th className={`${thClassName} hidden 2xl:table-cell`}>
                <span className="inline-flex items-center gap-1">
                  {t("list.columns.updated")}
                  <ArrowDown className="size-3.5" aria-hidden />
                </span>
              </th>
              <th className={`${thClassName} text-right`}>{t("list.columns.value")}</th>
              <th className={thClassName}>{t("list.columns.status")}</th>
              <th className="w-10 px-2 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {estimates.map((estimate) => (
              <EstimateListRow
                key={estimate.id}
                estimate={estimate}
                workspaceSlug={workspaceSlug}
                locale={locale}
                layout="table"
                visibleColumns={visibleColumns}
              />
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </>
  );
}
