"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { EstimateMobileAddRow } from "@/features/estimates/components/estimate-mobile-add-row";
import type { TemplateItemDraft } from "@/features/estimate-templates/lib/template-editor-draft";
import type { TemplateAutoSaveStatus } from "@/features/estimate-templates/hooks/use-template-autosave";
import type { TemplateSectionData } from "./template-items-table";
import { TemplateMobilePositionSheet } from "./template-mobile-position-sheet";
import { TemplateMobileSectionCard } from "./template-mobile-section-card";
import { TemplateMobileSectionSheet } from "./template-mobile-section-sheet";

interface TemplateItemsMobileListProps {
  sections: TemplateSectionData[];
  currency: string;
  advancedMode: boolean;
  onAddSection: () => void | Promise<string | undefined>;
  isAddingSection?: boolean;
  addingItemSectionIds?: string[];
  autosaveStatus?: TemplateAutoSaveStatus;
  onUpdateSection: (
    sectionId: string,
    patch: { title?: string; guidance?: string },
  ) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (
    itemId: string,
    data: Partial<
      Pick<TemplateItemDraft, "name" | "unit" | "unitPrice" | "vatRate" | "note">
    >,
  ) => void;
  onDeleteItem: (itemId: string) => void;
  onBlur: () => void | Promise<void>;
  onPositionSheetOpenChange?: (open: boolean) => void;
}

type ActiveItemRef = {
  sectionId: string;
  itemId: string;
  positionLabel: string;
};

export function TemplateItemsMobileList({
  sections,
  currency,
  advancedMode,
  onAddSection,
  isAddingSection = false,
  addingItemSectionIds = [],
  autosaveStatus = "idle",
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onBlur,
  onPositionSheetOpenChange,
}: TemplateItemsMobileListProps) {
  const t = useTranslations("workspaces.configuration.templates.editor");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((section) => [section.id, false])),
  );
  const [activeItem, setActiveItem] = useState<ActiveItemRef | null>(null);
  const [editSectionId, setEditSectionId] = useState<string | null>(null);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !(prev[sectionId] ?? false),
    }));
  }, []);

  const sectionById = useMemo(
    () => Object.fromEntries(sections.map((section) => [section.id, section])),
    [sections],
  );

  const activeLineItem = useMemo(() => {
    if (!activeItem) return null;
    const section = sectionById[activeItem.sectionId];
    return section?.items.find((item) => item.id === activeItem.itemId) ?? null;
  }, [activeItem, sectionById]);

  const editSection = editSectionId ? (sectionById[editSectionId] ?? null) : null;

  useEffect(() => {
    onPositionSheetOpenChange?.(activeItem !== null);
  }, [activeItem, onPositionSheetOpenChange]);

  return (
    <>
      <div className="space-y-2 px-2 py-2">
        {sections.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("noSections")}</p>
        ) : (
          sections.map((section, sectionIndex) => (
            <TemplateMobileSectionCard
              key={section.id}
              sectionId={section.id}
              sectionNumber={sectionIndex + 1}
              title={section.title}
              guidance={section.guidance}
              items={section.items}
              currency={currency}
              advancedMode={advancedMode}
              expanded={expandedSections[section.id] ?? false}
              canDeleteSection={sections.length > 1}
              onToggleExpanded={() => toggleSection(section.id)}
              onEditSection={() => setEditSectionId(section.id)}
              onAddItem={() => onAddItem(section.id)}
              isAddingItem={addingItemSectionIds.includes(section.id)}
              onDeleteSection={() => onDeleteSection(section.id)}
              onOpenItem={(itemId) =>
                setActiveItem({
                  sectionId: section.id,
                  itemId,
                  positionLabel: `${sectionIndex + 1}.${section.items.findIndex((item) => item.id === itemId) + 1}`,
                })
              }
            />
          ))
        )}
        <EstimateMobileAddRow
          variant="section"
          label={t("addSection")}
          pendingLabel={t("addingSection")}
          onClick={onAddSection}
          isPending={isAddingSection}
          disabled={isAddingSection}
        />
      </div>

      <TemplateMobilePositionSheet
        open={activeItem !== null}
        onOpenChange={(open) => {
          if (!open) setActiveItem(null);
        }}
        item={activeLineItem}
        positionLabel={activeItem?.positionLabel ?? ""}
        currency={currency}
        onPersistItem={onUpdateItem}
        onDelete={() => {
          if (!activeItem) return;
          onDeleteItem(activeItem.itemId);
        }}
        onBlur={onBlur}
        autosaveStatus={autosaveStatus}
      />

      <TemplateMobileSectionSheet
        open={editSectionId !== null}
        onOpenChange={(open) => {
          if (!open) setEditSectionId(null);
        }}
        section={editSection}
        advancedMode={advancedMode}
        onUpdateSection={onUpdateSection}
        onBlur={onBlur}
      />
    </>
  );
}
