"use client";

import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EstimateListRow } from "@/features/estimates/components/estimate-list-row";
import type { EstimateListPageItem } from "@/features/estimates/server/list-estimates-page-data";
import type { Locale } from "@/lib/locale";

interface EstimatesListTableProps {
  estimates: EstimateListPageItem[];
  workspaceSlug: string;
  locale: Locale;
  footer?: ReactNode;
}

const thClassName =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export function EstimatesListTable({
  estimates,
  workspaceSlug,
  locale,
  footer,
}: EstimatesListTableProps) {
  const t = useTranslations("estimates");

  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr>
              <th className={thClassName}>{t("list.columns.estimateName")}</th>
              <th className={`${thClassName} hidden md:table-cell`}>
                {t("list.columns.inquiry")}
              </th>
              <th className={`${thClassName} hidden lg:table-cell`}>
                {t("list.columns.investment")}
              </th>
              <th className={`${thClassName} hidden xl:table-cell`}>
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
              />
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
