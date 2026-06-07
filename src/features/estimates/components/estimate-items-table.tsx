"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import {
  EMPTY_ESTIMATE_ITEMS_FILTER,
  hasActiveFilters,
  itemIsVisible,
  type EstimateItemsFilterState,
} from "@/features/estimates/lib/estimate-item-filter";
import { cn } from "@/lib/utils";
import { EstimateSectionRow } from "./estimate-section-row";
import { EstimateLineItemRow, type LineItemData } from "./estimate-line-item-row";

export interface SectionData {
  id: string;
  title: string;
  sortOrder: number;
  items: LineItemData[];
}

export const ESTIMATE_TABLE_TITLE_COLSPAN = { basic: 4, advanced: 5 } as const;

interface EstimateItemsTableProps {
  sections: SectionData[];
  currency?: string;
  advancedMode: boolean;
  onUpdateSection: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (itemId: string, data: Partial<Omit<LineItemData, "id" | "sortOrder">>) => void;
  onDeleteItem: (itemId: string) => void;
  onReorderItems: (sectionId: string, fromIndex: number, toIndex: number) => void;
  onBlur: () => void;
  tableSearchQuery?: string;
  tableFilter?: EstimateItemsFilterState;
  scrollToSectionId?: string | null;
  onScrollToSectionHandled?: () => void;
}

type DragState = {
  sectionId: string;
  itemIndex: number;
} | null;

export function EstimateItemsTable({
  sections,
  currency = "PLN",
  advancedMode,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onBlur,
  tableSearchQuery = "",
  tableFilter,
  scrollToSectionId = null,
  onScrollToSectionHandled,
}: EstimateItemsTableProps) {
  const t = useTranslations("estimates");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(sections.map((s) => [s.id, true])),
  );
  const [dragState, setDragState] = useState<DragState>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isExpanded = useCallback(
    (sectionId: string) => expandedSections[sectionId] ?? true,
    [expandedSections],
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !(prev[sectionId] ?? true),
    }));
  };

  useEffect(() => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const section of sections) {
        if (!(section.id in next)) {
          next[section.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [sections]);

  useEffect(() => {
    if (!scrollToSectionId) return;

    let cancelled = false;
    let attempts = 0;

    const tryScroll = () => {
      if (cancelled) return;

      const row = document.querySelector(
        `[data-estimate-section-id="${scrollToSectionId}"]`,
      );

      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        onScrollToSectionHandled?.();
        return;
      }

      if (attempts < 12) {
        attempts += 1;
        requestAnimationFrame(tryScroll);
        return;
      }

      onScrollToSectionHandled?.();
    };

    requestAnimationFrame(tryScroll);

    return () => {
      cancelled = true;
    };
  }, [scrollToSectionId, sections, onScrollToSectionHandled]);

  const clearDrag = () => {
    setDragState(null);
    setDragOverIndex(null);
  };

  if (sections.length === 0) {
    return (
      <div className="px-4 py-14 text-center text-sm text-muted-foreground">
        {t("editor.noSections")}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full border-collapse text-sm",
            advancedMode ? "min-w-[1000px]" : "min-w-[880px]",
          )}
        >
          <thead>
            <tr className="border-b border-border/60 text-xs font-medium text-muted-foreground">
              <th className="w-9 px-2 py-3" aria-hidden />
              <th className="w-14 px-2 py-3 text-left">{t("editor.columns.no")}</th>
              <th className="min-w-[12rem] px-2 py-3 text-left">
                {t("editor.columns.name")}
              </th>
              <th className="w-20 px-2 py-3 text-left">{t("editor.columns.unit")}</th>
              <th className="w-20 px-2 py-3 text-right tabular-nums">
                {t("editor.columns.qty")}
              </th>
              {advancedMode ? (
                <th className="w-28 px-2 py-3 text-right">
                  {t("editor.columns.baseUnitPrice")}
                </th>
              ) : null}
              <th className="w-28 px-2 py-3 text-right">{t("editor.columns.unitPrice")}</th>
              <th className="w-28 px-2 py-3 text-right">{t("editor.columns.net")}</th>
              <th className="w-16 px-2 py-3 text-right">{t("editor.columns.vat")}</th>
              <th className="w-28 px-2 py-3 text-right">{t("editor.columns.gross")}</th>
              <th className="w-10 px-2 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {sections.map((section, sectionIndex) => {
              const sectionNumber = sectionIndex + 1;
              const expanded = isExpanded(section.id);
              const filter = tableFilter ?? EMPTY_ESTIMATE_ITEMS_FILTER;
              const hasActiveSearchOrFilter =
                tableSearchQuery.trim().length > 0 || hasActiveFilters(filter);
              const hasVisibleItems = section.items.some((item) =>
                itemIsVisible(item, {
                  searchQuery: tableSearchQuery,
                  filter,
                }),
              );

              if (hasActiveSearchOrFilter && !hasVisibleItems) {
                return null;
              }

              return (
                <SectionRows
                  key={section.id}
                  section={section}
                  sectionNumber={sectionNumber}
                  expanded={expanded}
                  advancedMode={advancedMode}
                  currency={currency}
                  dragState={dragState}
                  dragOverIndex={dragOverIndex}
                  onToggleExpanded={() => toggleSection(section.id)}
                  onUpdateSection={onUpdateSection}
                  onDeleteSection={onDeleteSection}
                  onAddItem={onAddItem}
                  onUpdateItem={onUpdateItem}
                  onDeleteItem={onDeleteItem}
                  onBlur={onBlur}
                  tableSearchQuery={tableSearchQuery}
                  tableFilter={tableFilter}
                  onDragStart={(itemIndex) =>
                    setDragState({ sectionId: section.id, itemIndex })
                  }
                  onDragOver={(itemIndex) => {
                    if (
                      dragState?.sectionId === section.id &&
                      dragState.itemIndex !== itemIndex
                    ) {
                      setDragOverIndex(itemIndex);
                    }
                  }}
                  onDragLeave={(itemIndex) => {
                    if (dragOverIndex === itemIndex) {
                      setDragOverIndex(null);
                    }
                  }}
                  onDrop={(itemIndex) => {
                    if (
                      dragState?.sectionId === section.id &&
                      dragState.itemIndex !== itemIndex
                    ) {
                      onReorderItems(section.id, dragState.itemIndex, itemIndex);
                    }
                    clearDrag();
                  }}
                  onDragEnd={clearDrag}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionRows({
  section,
  sectionNumber,
  expanded,
  advancedMode,
  currency,
  dragState,
  dragOverIndex,
  onToggleExpanded,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onBlur,
  tableSearchQuery,
  tableFilter,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  section: SectionData;
  sectionNumber: number;
  expanded: boolean;
  advancedMode: boolean;
  currency: string;
  dragState: DragState;
  dragOverIndex: number | null;
  onToggleExpanded: () => void;
  onUpdateSection: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (
    itemId: string,
    data: Partial<Omit<LineItemData, "id" | "sortOrder">>,
  ) => void;
  onDeleteItem: (itemId: string) => void;
  onBlur: () => void;
  tableSearchQuery: string;
  tableFilter?: EstimateItemsFilterState;
  onDragStart: (itemIndex: number) => void;
  onDragOver: (itemIndex: number) => void;
  onDragLeave: (itemIndex: number) => void;
  onDrop: (itemIndex: number) => void;
  onDragEnd: () => void;
}) {
  const visibleItemEntries = section.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) =>
      itemIsVisible(item, {
        searchQuery: tableSearchQuery,
        filter: tableFilter ?? EMPTY_ESTIMATE_ITEMS_FILTER,
      }),
    );

  return (
    <>
      <EstimateSectionRow
        id={section.id}
        title={section.title}
        items={section.items}
        sectionNumber={sectionNumber}
        expanded={expanded}
        onToggleExpanded={onToggleExpanded}
        onUpdateSection={onUpdateSection}
        onDeleteSection={onDeleteSection}
        onAddItem={onAddItem}
        onBlur={onBlur}
        currency={currency}
        titleColSpan={
          advancedMode
            ? ESTIMATE_TABLE_TITLE_COLSPAN.advanced
            : ESTIMATE_TABLE_TITLE_COLSPAN.basic
        }
      />
      {expanded
        ? visibleItemEntries.map(({ item, index }) => (
            <EstimateLineItemRow
              key={item.id}
              item={item}
              positionLabel={`${sectionNumber}.${index + 1}`}
              advancedMode={advancedMode}
              onUpdate={onUpdateItem}
              onDelete={onDeleteItem}
              onBlur={onBlur}
              searchQuery={tableSearchQuery}
              isDragging={
                dragState?.sectionId === section.id && dragState.itemIndex === index
              }
              isDragOver={
                dragState?.sectionId === section.id && dragOverIndex === index
              }
              onDragHandleStart={() => onDragStart(index)}
              onDragHandleEnd={onDragEnd}
              onDragOverRow={() => onDragOver(index)}
              onDragLeaveRow={() => onDragLeave(index)}
              onDropOnRow={() => onDrop(index)}
            />
          ))
        : null}
    </>
  );
}
