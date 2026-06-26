"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import type {
  TemplateItemDraft,
  TemplateSectionDraft,
} from "@/features/estimate-templates/lib/template-editor-draft";
import { TemplateLineItemRow } from "./template-line-item-row";
import { TemplateSectionRow } from "./template-section-row";

export type TemplateSectionData = TemplateSectionDraft;

type TemplateItemEditableFields = Pick<
  TemplateItemDraft,
  "name" | "unit" | "unitPrice" | "vatRate" | "note"
>;

interface TemplateItemsTableProps {
  sections: TemplateSectionData[];
  currency: string;
  advancedMode: boolean;
  onUpdateSection: (
    sectionId: string,
    patch: { title?: string; guidance?: string },
  ) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  addingItemSectionIds?: string[];
  onUpdateItem: (itemId: string, data: Partial<TemplateItemEditableFields>) => void;
  onDeleteItem: (itemId: string) => void;
  onReorderItems: (sectionId: string, fromIndex: number, toIndex: number) => void;
  onBlur: () => void | Promise<void>;
  scrollToSectionId?: string | null;
  onScrollToSectionHandled?: () => void;
  defaultSectionsExpanded?: boolean;
}

type DragState = {
  sectionId: string;
  itemIndex: number;
} | null;

export function TemplateItemsTable({
  sections,
  currency,
  advancedMode,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  addingItemSectionIds = [],
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onBlur,
  scrollToSectionId = null,
  onScrollToSectionHandled,
  defaultSectionsExpanded = true,
}: TemplateItemsTableProps) {
  const t = useTranslations("workspaces.configuration.templates.editor");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((section) => [section.id, defaultSectionsExpanded])),
  );
  const [dragState, setDragState] = useState<DragState>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isExpanded = useCallback(
    (sectionId: string) => expandedSections[sectionId] ?? defaultSectionsExpanded,
    [defaultSectionsExpanded, expandedSections],
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !(prev[sectionId] ?? defaultSectionsExpanded),
    }));
  };

  useEffect(() => {
    if (!scrollToSectionId) return;

    let cancelled = false;
    let attempts = 0;

    const tryScroll = () => {
      if (cancelled) return;

      const row = document.querySelector(`[data-template-section-id="${scrollToSectionId}"]`);

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
        {t("noSections")}
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden">
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-9" />
          <col className="w-12" />
          <col />
          <col className="w-[4.25rem]" />
          <col className="w-[5.75rem]" />
          <col className="w-[3.5rem]" />
          <col className="w-10" />
        </colgroup>
        <thead>
          <tr className="border-b border-border/60 text-xs font-medium text-muted-foreground">
            <th className="px-2 py-3" aria-hidden />
            <th className="px-2 py-3 text-left">{t("columnNo")}</th>
            <th className="px-2 py-3 text-left">{t("columnName")}</th>
            <th className="px-2 py-3 text-left">{t("columnUnit")}</th>
            <th className="px-2 py-3 text-left">{t("columnUnitPrice")}</th>
            <th className="px-2 py-3 text-left">{t("columnVat")}</th>
            <th className="px-2 py-3" aria-hidden />
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
                  advancedMode={advancedMode}
                  canDeleteSection={sections.length > 1}
                  dragState={dragState}
                  dragOverIndex={dragOverIndex}
                  onToggleExpanded={() => toggleSection(section.id)}
                  onUpdateSection={onUpdateSection}
                  onDeleteSection={onDeleteSection}
                  onAddItem={onAddItem}
                  isAddingItem={addingItemSectionIds.includes(section.id)}
                  onUpdateItem={onUpdateItem}
                  onDeleteItem={onDeleteItem}
                  onBlur={onBlur}
                  currency={currency}
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
  );
}

function SectionRows({
  section,
  sectionNumber,
  expanded,
  advancedMode,
  canDeleteSection,
  dragState,
  dragOverIndex,
  onToggleExpanded,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  isAddingItem = false,
  onUpdateItem,
  onDeleteItem,
  onBlur,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  currency,
}: {
  section: TemplateSectionData;
  sectionNumber: number;
  expanded: boolean;
  advancedMode: boolean;
  canDeleteSection: boolean;
  dragState: DragState;
  dragOverIndex: number | null;
  onToggleExpanded: () => void;
  onUpdateSection: (
    sectionId: string,
    patch: { title?: string; guidance?: string },
  ) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  isAddingItem?: boolean;
  onUpdateItem: (itemId: string, data: Partial<TemplateItemEditableFields>) => void;
  onDeleteItem: (itemId: string) => void;
  onBlur: () => void | Promise<void>;
  currency: string;
  onDragStart: (itemIndex: number) => void;
  onDragOver: (itemIndex: number) => void;
  onDragLeave: (itemIndex: number) => void;
  onDrop: (itemIndex: number) => void;
  onDragEnd: () => void;
}) {
  return (
    <>
      <TemplateSectionRow
        id={section.id}
        title={section.title}
        guidance={section.guidance}
        sectionNumber={sectionNumber}
        expanded={expanded}
        advancedMode={advancedMode}
        onToggleExpanded={onToggleExpanded}
        onUpdateSection={onUpdateSection}
        onDeleteSection={onDeleteSection}
        onAddItem={onAddItem}
        isAddingItem={isAddingItem}
        onBlur={onBlur}
        canDelete={canDeleteSection}
      />
      {expanded
        ? section.items.map((item, index) => (
            <TemplateLineItemRow
              key={item.id}
              item={item}
              positionLabel={`${sectionNumber}.${index + 1}`}
              currency={currency}
              onUpdate={onUpdateItem}
              onDelete={onDeleteItem}
              onBlur={onBlur}
              isDragging={
                dragState?.sectionId === section.id && dragState.itemIndex === index
              }
              isDragOver={dragState?.sectionId === section.id && dragOverIndex === index}
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
