"use client";

import { useTranslations } from "next-intl";

import { EstimateSectionRow } from "./estimate-section-row";
import type { LineItemData } from "./estimate-line-item-row";

export interface SectionData {
  id: string;
  title: string;
  sortOrder: number;
  items: LineItemData[];
}

interface EstimateItemsTableProps {
  sections: SectionData[];
  currency?: string;
  onUpdateSection: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (itemId: string, data: Partial<Omit<LineItemData, "id" | "sortOrder">>) => void;
  onDeleteItem: (itemId: string) => void;
  onBlur: () => void;
}

export function EstimateItemsTable({
  sections,
  currency = "PLN",
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onBlur,
}: EstimateItemsTableProps) {
  const t = useTranslations("estimates");

  return (
    <div className="space-y-4">
      {sections.map((section, sectionIndex) => (
        <EstimateSectionRow
          key={section.id}
          id={section.id}
          title={section.title}
          items={section.items}
          sectionNumber={sectionIndex + 1}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onBlur={onBlur}
          currency={currency}
        />
      ))}

      {sections.length === 0 && (
        <div className="rounded-xl border border-dashed bg-muted/20 py-14 text-center text-sm text-muted-foreground">
          {t("editor.noSections")}
        </div>
      )}
    </div>
  );
}
