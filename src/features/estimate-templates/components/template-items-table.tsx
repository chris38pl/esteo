"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type {
  TemplateItemDraft,
  TemplateSectionDraft,
} from "@/features/estimate-templates/lib/template-editor-draft";
import { TemplateLineItemRow } from "./template-line-item-row";
import { TemplateSectionRow } from "./template-section-row";

export type TemplateSectionData = TemplateSectionDraft;

interface TemplateItemsTableProps {
  sections: TemplateSectionData[];
  advancedMode: boolean;
  onUpdateSection: (
    sectionId: string,
    patch: { title?: string; guidance?: string },
  ) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  addingItemSectionIds?: string[];
  onUpdateItem: (
    itemId: string,
    data: Partial<Pick<TemplateItemDraft, "name" | "unit">>,
  ) => void;
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
    <div className="min-w-0">
      <div className="overflow-x-auto">
        <table className={cn("w-full min-w-[640px] border-collapse text-sm")}>
          <thead>
            <tr className="border-b border-border/60 text-xs font-medium text-muted-foreground">
              <th className="w-9 px-2 py-3" aria-hidden />
              <th className="w-14 px-2 py-3 text-left">{t("columnNo")}</th>
              <th className="min-w-[12rem] px-2 py-3 text-left">{t("columnName")}</th>
              <th className="w-28 px-2 py-3 text-left">{t("columnUnit")}</th>
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
  onUpdateItem: (
    itemId: string,
    data: Partial<Pick<TemplateItemDraft, "name" | "unit">>,
  ) => void;
  onDeleteItem: (itemId: string) => void;
  onBlur: () => void | Promise<void>;
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
