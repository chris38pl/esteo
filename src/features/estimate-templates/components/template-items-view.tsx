"use client";

import { useState } from "react";

import {
  estimateItemsDesktopClass,
  estimateItemsMobileClass,
} from "@/features/estimates/lib/estimate-layout-config";
import type { TemplateItemDraft } from "@/features/estimate-templates/lib/template-editor-draft";
import type { TemplateAutoSaveStatus } from "@/features/estimate-templates/hooks/use-template-autosave";
import { TemplateItemsMobileList } from "./template-items-mobile-list";
import { TemplateItemsTable, type TemplateSectionData } from "./template-items-table";
import { TemplateItemsToolbar } from "./template-items-toolbar";
import { TemplateMobileToolbar } from "./template-mobile-toolbar";

type TemplateItemEditableFields = Pick<
  TemplateItemDraft,
  "name" | "unit" | "unitPrice" | "vatRate" | "note"
>;

interface TemplateItemsViewProps {
  sections: TemplateSectionData[];
  currency: string;
  advancedMode: boolean;
  onAdvancedModeChange: (value: boolean) => void;
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
  onUpdateItem: (itemId: string, data: Partial<TemplateItemEditableFields>) => void;
  onDeleteItem: (itemId: string) => void;
  onReorderItems: (sectionId: string, fromIndex: number, toIndex: number) => void;
  onBlur: () => void | Promise<void>;
  onMobilePositionSheetOpenChange?: (open: boolean) => void;
  defaultSectionsExpanded?: boolean;
}

export function TemplateItemsView({
  sections,
  currency,
  advancedMode,
  onAdvancedModeChange,
  onAddSection,
  isAddingSection = false,
  addingItemSectionIds = [],
  autosaveStatus = "idle",
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onBlur,
  onMobilePositionSheetOpenChange,
  defaultSectionsExpanded = true,
}: TemplateItemsViewProps) {
  const [scrollToSectionId, setScrollToSectionId] = useState<string | null>(null);
  const itemsCount = sections.reduce((sum, section) => sum + section.items.length, 0);

  const handleDesktopAddSection = async () => {
    const sectionId = await onAddSection();
    if (sectionId) {
      setScrollToSectionId(sectionId);
    }
  };

  return (
    <>
      <div className={estimateItemsDesktopClass}>
        <TemplateItemsToolbar
          advancedMode={advancedMode}
          onAdvancedModeChange={onAdvancedModeChange}
          onAddSection={handleDesktopAddSection}
          isAddingSection={isAddingSection}
        />
        <TemplateItemsTable
          sections={sections}
          currency={currency}
          advancedMode={advancedMode}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          onAddItem={onAddItem}
          addingItemSectionIds={addingItemSectionIds}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onReorderItems={onReorderItems}
          onBlur={onBlur}
          scrollToSectionId={scrollToSectionId}
          onScrollToSectionHandled={() => setScrollToSectionId(null)}
          defaultSectionsExpanded={defaultSectionsExpanded}
        />
      </div>

      <div className={estimateItemsMobileClass}>
        <TemplateMobileToolbar
          sectionsCount={sections.length}
          itemsCount={itemsCount}
          advancedMode={advancedMode}
          onAdvancedModeChange={onAdvancedModeChange}
        />
        <TemplateItemsMobileList
          sections={sections}
          currency={currency}
          advancedMode={advancedMode}
          onAddSection={onAddSection}
          isAddingSection={isAddingSection}
          addingItemSectionIds={addingItemSectionIds}
          autosaveStatus={autosaveStatus}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onBlur={onBlur}
          onPositionSheetOpenChange={onMobilePositionSheetOpenChange}
        />
      </div>
    </>
  );
}
