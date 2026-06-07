"use client";

import { memo } from "react";
import { ChevronDown, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { calculateEstimate } from "@/features/estimates/lib/calculate-estimate";
import { formatEstimateCurrency } from "@/features/estimates/lib/format-estimate-currency";
import { cn } from "@/lib/utils";
import {
  EMPTY_ESTIMATE_ITEMS_FILTER,
  hasActiveFilters,
  itemIsVisible,
  type EstimateItemsFilterState,
} from "@/features/estimates/lib/estimate-item-filter";
import { EstimateMobileAddRow } from "./estimate-mobile-add-row";
import { EstimateMobilePositionCard } from "./estimate-mobile-position-card";
import type { LineItemData } from "./estimate-line-item-row";

interface EstimateMobileSectionCardProps {
  sectionId: string;
  sectionNumber: number;
  title: string;
  items: LineItemData[];
  currency: string;
  advancedMode: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onRename: () => void;
  onAddItem: () => void;
  onDeleteSection: () => void;
  onOpenItem: (itemId: string) => void;
  searchQuery?: string;
  tableFilter?: EstimateItemsFilterState;
}

function EstimateMobileSectionCardComponent({
  sectionId,
  sectionNumber,
  title,
  items,
  currency,
  advancedMode,
  expanded,
  onToggleExpanded,
  onRename,
  onAddItem,
  onDeleteSection,
  onOpenItem,
  searchQuery = "",
  tableFilter,
}: EstimateMobileSectionCardProps) {
  const t = useTranslations("estimates");
  const locale = useLocale();

  const filter = tableFilter ?? EMPTY_ESTIMATE_ITEMS_FILTER;
  const visibleItems = items.filter((item) =>
    itemIsVisible(item, { searchQuery, filter }),
  );
  const sectionCalc = calculateEstimate(
    items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      vatRate: i.vatRate,
    })),
    0,
  );

  if ((searchQuery.trim() || hasActiveFilters(filter)) && visibleItems.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-sm">
      <div className="flex items-center gap-1.5 px-3 py-2.5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              !expanded && "-rotate-90",
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {sectionNumber}. {title || t("editor.newSection")}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-primary">
            {formatEstimateCurrency(sectionCalc.totalGross, currency, locale)}
          </p>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8 shrink-0 rounded-lg text-muted-foreground"
              aria-label={t("editor.mobile.sectionActions")}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onAddItem} className="gap-2">
              <Plus className="size-4" />
              {t("editor.addItem")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRename} className="gap-2">
              <Pencil className="size-4" />
              {t("editor.mobile.renameSection")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDeleteSection} className="gap-2 text-destructive">
              <Trash2 className="size-4" />
              {t("editor.deleteSection")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded ? (
        <div className="border-t border-border/50">
          {visibleItems.map((item) => {
            const originalIndex = items.findIndex((i) => i.id === item.id);
            const positionLabel = `${sectionNumber}.${originalIndex + 1}`;
            return (
              <EstimateMobilePositionCard
                key={item.id}
                item={item}
                positionLabel={positionLabel}
                currency={currency}
                advancedMode={advancedMode}
                onOpen={() => onOpenItem(item.id)}
              />
            );
          })}
          <EstimateMobileAddRow
            variant="item"
            label={t("editor.addItem")}
            onClick={onAddItem}
          />
        </div>
      ) : null}
    </section>
  );
}

export const EstimateMobileSectionCard = memo(EstimateMobileSectionCardComponent);
