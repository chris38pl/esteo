"use client";

import { useMemo } from "react";
import { Folder, List } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { EstimateMobileMarginBadge } from "./estimate-mobile-margin-badge";
import type { SectionData } from "./estimate-items-table";

interface EstimateMobileItemsStatsProps {
  sections: SectionData[];
  advancedMode?: boolean;
  marginPercent?: number;
}

function SoftStatBadge({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1",
        "bg-muted/45 text-[11px] font-medium text-muted-foreground",
        "dark:bg-blue-950/55 dark:text-muted-foreground",
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
      <span className="whitespace-nowrap tabular-nums">{label}</span>
    </span>
  );
}

export function EstimateMobileItemsStats({
  sections,
  advancedMode = false,
  marginPercent = 0,
}: EstimateMobileItemsStatsProps) {
  const t = useTranslations("estimates");

  const itemCount = useMemo(
    () => sections.reduce((total, section) => total + section.items.length, 0),
    [sections],
  );

  const sectionCount = sections.length;

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden"
      aria-label={t("editor.mobile.estimateStatsAria", {
        sections: sectionCount,
        items: itemCount,
      })}
    >
      <SoftStatBadge
        icon={Folder}
        label={t("editor.sectionCount", { count: sectionCount })}
      />
      <SoftStatBadge
        icon={List}
        label={t("editor.itemCount", { count: itemCount })}
      />
      {advancedMode ? <EstimateMobileMarginBadge marginPercent={marginPercent} /> : null}
    </div>
  );
}
