"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { SectionData } from "./estimate-items-table";
import type { LineItemData } from "./estimate-line-item-row";
import { EstimateMobileAddRow } from "./estimate-mobile-add-row";
import { EstimateMobileSectionCard } from "./estimate-mobile-section-card";
import { EstimateMobilePositionSheet } from "./estimate-mobile-position-sheet";
import { EstimateMobileSectionSheet } from "./estimate-mobile-section-sheet";
import type { EstimateItemsFilterState } from "@/features/estimates/lib/estimate-item-filter";

interface EstimateItemsMobileListProps {
  sections: SectionData[];
  currency: string;
  advancedMode: boolean;
  marginPercent: number;
  tableSearchQuery?: string;
  tableFilter?: EstimateItemsFilterState;
  onAddSection: () => void;
  onUpdateSection: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (itemId: string, data: Partial<Omit<LineItemData, "id" | "sortOrder">>) => void;
  onDeleteItem: (itemId: string) => void;
  onDuplicateItem: (sectionId: string, itemId: string) => void;
  onBlur: () => void | Promise<void>;
  onPositionSheetOpenChange?: (open: boolean) => void;
}

type ActiveItemRef = {
  sectionId: string;
  itemId: string;
  positionLabel: string;
};

export function EstimateItemsMobileList({
  sections,
  currency,
  advancedMode,
  marginPercent,
  tableSearchQuery = "",
  tableFilter,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onBlur,
  onPositionSheetOpenChange,
}: EstimateItemsMobileListProps) {
  const t = useTranslations("estimates");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.id, false])),
  );
  const [activeItem, setActiveItem] = useState<ActiveItemRef | null>(null);
  const [renameSectionId, setRenameSectionId] = useState<string | null>(null);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !(prev[sectionId] ?? false),
    }));
  }, []);

  const sectionById = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s])),
    [sections],
  );

  const activeLineItem = useMemo(() => {
    if (!activeItem) return null;
    const section = sectionById[activeItem.sectionId];
    return section?.items.find((i) => i.id === activeItem.itemId) ?? null;
  }, [activeItem, sectionById]);

  const renameSection = renameSectionId ? sectionById[renameSectionId] ?? null : null;

  const openItem = (sectionId: string, itemId: string, positionLabel: string) => {
    setActiveItem({ sectionId, itemId, positionLabel });
  };

  useEffect(() => {
    onPositionSheetOpenChange?.(activeItem !== null);
  }, [activeItem, onPositionSheetOpenChange]);

  return (
    <>
      <div className="space-y-2 px-2 py-2">
        {sections.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {t("editor.noSections")}
          </p>
        ) : (
          sections.map((section, sectionIndex) => (
            <EstimateMobileSectionCard
              key={section.id}
              sectionId={section.id}
              sectionNumber={sectionIndex + 1}
              title={section.title}
              items={section.items}
              currency={currency}
              advancedMode={advancedMode}
              expanded={expandedSections[section.id] ?? false}
              searchQuery={tableSearchQuery}
              tableFilter={tableFilter}
              onToggleExpanded={() => toggleSection(section.id)}
              onRename={() => setRenameSectionId(section.id)}
              onAddItem={() => onAddItem(section.id)}
              onDeleteSection={() => onDeleteSection(section.id)}
              onOpenItem={(itemId) =>
                openItem(
                  section.id,
                  itemId,
                  `${sectionIndex + 1}.${section.items.findIndex((i) => i.id === itemId) + 1}`,
                )
              }
            />
          ))
        )}
        <EstimateMobileAddRow
          variant="section"
          label={t("editor.addSection")}
          onClick={onAddSection}
        />
      </div>

      <EstimateMobilePositionSheet
        open={activeItem !== null}
        onOpenChange={(open) => {
          if (!open) setActiveItem(null);
        }}
        item={activeLineItem}
        positionLabel={activeItem?.positionLabel ?? ""}
        currency={currency}
        advancedMode={advancedMode}
        marginPercent={marginPercent}
        onSave={onUpdateItem}
        onDuplicate={() => {
          if (!activeItem) return;
          onDuplicateItem(activeItem.sectionId, activeItem.itemId);
        }}
        onDelete={() => {
          if (!activeItem) return;
          onDeleteItem(activeItem.itemId);
        }}
        onBlur={onBlur}
      />

      <EstimateMobileSectionSheet
        open={renameSectionId !== null}
        onOpenChange={(open) => {
          if (!open) setRenameSectionId(null);
        }}
        mode="rename"
        section={renameSection}
        onRename={onUpdateSection}
        onBlur={onBlur}
      />
    </>
  );
}
