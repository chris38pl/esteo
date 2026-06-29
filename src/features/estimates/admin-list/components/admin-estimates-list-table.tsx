"use client";

import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { AdminEstimateListRow } from "@/features/estimates/admin-list/components/admin-estimate-list-row";
import type { EstimatesListPreferences } from "@/features/estimates/hooks/use-estimates-list-preferences";
import { optionalColumnClassName } from "@/features/estimates/hooks/use-estimates-list-preferences";
import type { AdminEstimateListRow as AdminEstimateListRowType } from "@/features/estimates/server/admin-estimates";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface AdminEstimatesListTableProps {
  estimates: AdminEstimateListRowType[];
  locale: Locale;
  visibleColumns: EstimatesListPreferences["visibleColumns"];
  footer?: ReactNode;
}

const thClassName =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export function AdminEstimatesListTable({
  estimates,
  locale,
  visibleColumns,
  footer,
}: AdminEstimatesListTableProps) {
  const tEstimates = useTranslations("estimates");
  const tAdmin = useTranslations("admin.estimates");

  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {estimates.map((estimate) => (
          <AdminEstimateListRow
            key={estimate.id}
            estimate={estimate}
            locale={locale}
            layout="list"
            visibleColumns={visibleColumns}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr>
              <th className={thClassName}>{tEstimates("list.columns.estimateName")}</th>
              <th className={cn(thClassName, "hidden md:table-cell")}>{tAdmin("columns.workspace")}</th>
              <th
                className={cn(
                  thClassName,
                  optionalColumnClassName("inquiry", visibleColumns.inquiry, ""),
                )}
              >
                {tEstimates("list.columns.inquiry")}
              </th>
              <th
                className={cn(
                  thClassName,
                  optionalColumnClassName("investment", visibleColumns.investment, ""),
                )}
              >
                {tEstimates("list.columns.investment")}
              </th>
              <th
                className={cn(
                  thClassName,
                  optionalColumnClassName("client", visibleColumns.client, ""),
                )}
              >
                {tEstimates("list.columns.client")}
              </th>
              <th className={`${thClassName} hidden 2xl:table-cell`}>
                <span className="inline-flex items-center gap-1">
                  {tEstimates("list.columns.updated")}
                  <ArrowDown className="size-3.5" aria-hidden />
                </span>
              </th>
              <th className={`${thClassName} text-right`}>{tEstimates("list.columns.value")}</th>
              <th className={thClassName}>{tEstimates("list.columns.status")}</th>
            </tr>
          </thead>
          <tbody>
            {estimates.map((estimate) => (
              <AdminEstimateListRow
                key={estimate.id}
                estimate={estimate}
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
