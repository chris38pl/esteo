"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { SectionData } from "./estimate-items-table";
import type { LineItemData } from "./estimate-line-item-row";
import { EstimateMobileSectionCard } from "./estimate-mobile-section-card";
import { EstimateMobilePositionSheet } from "./estimate-mobile-position-sheet";
import { EstimateMobileSectionSheet } from "./estimate-mobile-section-sheet";

interface EstimateItemsMobileListProps {
  sections: SectionData[];
  currency: string;
  advancedMode: boolean;
  marginPercent: number;
  tableSearchQuery?: string;
  onUpdateSection: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (itemId: string, data: Partial<Omit<LineItemData, "id" | "sortOrder">>) => void;
  onDeleteItem: (itemId: string) => void;
  onDuplicateItem: (sectionId: string, itemId: string) => void;
  onBlur: () => void;
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
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onBlur,
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

  if (sections.length === 0) {
    return (
      <div className="px-4 py-14 text-center text-sm text-muted-foreground">
        {t("editor.noSections")}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 px-3 py-3">
        {sections.map((section, sectionIndex) => (
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
            onToggleExpanded={() => toggleSection(section.id)}
            onRename={() => setRenameSectionId(section.id)}
            onAddItem={() => onAddItem(section.id)}
            onDeleteSection={() => onDeleteSection(section.id)}
            onOpenItem={(itemId) =>
              openItem(section.id, itemId, `${sectionIndex + 1}.${section.items.findIndex((i) => i.id === itemId) + 1}`)
            }
            onEditItem={(itemId) =>
              openItem(section.id, itemId, `${sectionIndex + 1}.${section.items.findIndex((i) => i.id === itemId) + 1}`)
            }
            onDuplicateItem={(itemId) => onDuplicateItem(section.id, itemId)}
            onDeleteItem={onDeleteItem}
          />
        ))}
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
