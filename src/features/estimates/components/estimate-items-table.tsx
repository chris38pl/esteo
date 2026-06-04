"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { EstimateSectionRow } from "./estimate-section-row";
import { EstimateLineItemRow, type LineItemData } from "./estimate-line-item-row";

export interface SectionData {
  id: string;
  title: string;
  sortOrder: number;
  items: LineItemData[];
}

interface EstimateItemsTableProps {
  sections: SectionData[];
  currency?: string;
  marginPercent: number;
  onUpdateSection: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (itemId: string, data: Partial<Omit<LineItemData, "id" | "sortOrder">>) => void;
  onDeleteItem: (itemId: string) => void;
  onReorderItems: (sectionId: string, fromIndex: number, toIndex: number) => void;
  onBlur: () => void;
}

type DragState = {
  sectionId: string;
  itemIndex: number;
} | null;

export function EstimateItemsTable({
  sections,
  currency = "PLN",
  marginPercent,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onBlur,
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
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs font-medium text-muted-foreground">
              <th className="w-9 px-2 py-3" aria-hidden />
              <th className="w-14 px-2 py-3 text-left">{t("editor.columns.no")}</th>
              <th className="min-w-[12rem] px-2 py-3 text-left">
                {t("editor.columns.name")}
              </th>
              <th className="w-20 px-2 py-3 text-left">{t("editor.columns.unit")}</th>
              <th className="w-20 px-2 py-3 text-right">{t("editor.columns.qty")}</th>
              <th className="w-28 px-2 py-3 text-right">{t("editor.columns.unitPrice")}</th>
              <th className="w-28 px-2 py-3 text-right">{t("editor.columns.net")}</th>
              <th className="w-20 px-2 py-3 text-right">{t("editor.columns.margin")}</th>
              <th className="w-16 px-2 py-3 text-right">{t("editor.columns.vat")}</th>
              <th className="w-28 px-2 py-3 text-right">{t("editor.columns.gross")}</th>
              <th className="w-10 px-2 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {sections.map((section, sectionIndex) => {
              const sectionNumber = sectionIndex + 1;
              const expanded = isExpanded(section.id);

              return (
                <SectionRows
                  key={section.id}
                  section={section}
                  sectionNumber={sectionNumber}
                  expanded={expanded}
                  currency={currency}
                  marginPercent={marginPercent}
                  dragState={dragState}
                  dragOverIndex={dragOverIndex}
                  onToggleExpanded={() => toggleSection(section.id)}
                  onUpdateSection={onUpdateSection}
                  onDeleteSection={onDeleteSection}
                  onAddItem={onAddItem}
                  onUpdateItem={onUpdateItem}
                  onDeleteItem={onDeleteItem}
                  onBlur={onBlur}
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
  currency,
  marginPercent,
  dragState,
  dragOverIndex,
  onToggleExpanded,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onBlur,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  section: SectionData;
  sectionNumber: number;
  expanded: boolean;
  currency: string;
  marginPercent: number;
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
  onDragStart: (itemIndex: number) => void;
  onDragOver: (itemIndex: number) => void;
  onDragLeave: (itemIndex: number) => void;
  onDrop: (itemIndex: number) => void;
  onDragEnd: () => void;
}) {
  return (
    <>
      <EstimateSectionRow
        id={section.id}
        title={section.title}
        items={section.items}
        sectionNumber={sectionNumber}
        marginPercent={marginPercent}
        expanded={expanded}
        onToggleExpanded={onToggleExpanded}
        onUpdateSection={onUpdateSection}
        onDeleteSection={onDeleteSection}
        onAddItem={onAddItem}
        onBlur={onBlur}
        currency={currency}
      />
      {expanded
        ? section.items.map((item, index) => (
            <EstimateLineItemRow
              key={item.id}
              item={item}
              positionLabel={`${sectionNumber}.${index + 1}`}
              marginPercent={marginPercent}
              onUpdate={onUpdateItem}
              onDelete={onDeleteItem}
              onBlur={onBlur}
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
