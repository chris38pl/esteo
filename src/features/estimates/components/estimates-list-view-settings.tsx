"use client";

import { useTranslations } from "next-intl";

import {
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  OPTIONAL_COLUMN_IDS,
  type EstimatesListPageSize,
  type EstimatesListPreferences,
  type OptionalColumnId,
} from "@/features/estimates/hooks/use-estimates-list-preferences";

const PAGE_SIZE_OPTIONS: EstimatesListPageSize[] = [10, 20, 50];

const OPTIONAL_COLUMN_LABELS = {
  inquiry: "list.columns.inquiry",
  investment: "list.columns.investment",
  client: "list.columns.client",
} as const;

interface EstimatesListViewSettingsProps {
  preferences: EstimatesListPreferences;
  onToggleColumn: (id: OptionalColumnId, visible: boolean) => void;
  onPageSizeChange: (pageSize: EstimatesListPageSize) => void;
}

export function EstimatesListViewSettings({
  preferences,
  onToggleColumn,
  onPageSizeChange,
}: EstimatesListViewSettingsProps) {
  const t = useTranslations("estimates");

  return (
    <>
      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
        {t("list.settings.columns")}
      </DropdownMenuLabel>
      {OPTIONAL_COLUMN_IDS.map((id) => (
        <DropdownMenuCheckboxItem
          key={id}
          checked={preferences.visibleColumns[id]}
          onCheckedChange={(checked) => onToggleColumn(id, checked === true)}
          onSelect={(event) => event.preventDefault()}
        >
          {t(OPTIONAL_COLUMN_LABELS[id])}
        </DropdownMenuCheckboxItem>
      ))}

      <DropdownMenuSeparator />

      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
        {t("list.settings.pageSize")}
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={String(preferences.pageSize)}
        onValueChange={(value) => onPageSizeChange(Number(value) as EstimatesListPageSize)}
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <DropdownMenuRadioItem key={size} value={String(size)}>
            {size}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
}
