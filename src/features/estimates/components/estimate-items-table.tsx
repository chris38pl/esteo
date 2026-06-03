"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
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
  onAddSection: () => void;
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
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onBlur,
}: EstimateItemsTableProps) {
  const t = useTranslations("estimates");

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
              <th className="px-2 py-2 text-center w-8">{t("editor.columns.no")}</th>
              <th className="px-2 py-2 text-left">{t("editor.columns.name")}</th>
              <th className="px-2 py-2 text-left w-20">{t("editor.columns.unit")}</th>
              <th className="px-2 py-2 text-right w-20">{t("editor.columns.qty")}</th>
              <th className="px-2 py-2 text-right w-28">{t("editor.columns.unitPrice")}</th>
              <th className="px-2 py-2 text-right w-24">{t("editor.columns.net")}</th>
              <th className="px-2 py-2 text-right w-20">{t("editor.columns.vat")}</th>
              <th className="px-2 py-2 text-right w-28">{t("editor.columns.gross")}</th>
              <th className="px-2 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <EstimateSectionRow
                key={section.id}
                id={section.id}
                title={section.title}
                items={section.items}
                onUpdateSection={onUpdateSection}
                onDeleteSection={onDeleteSection}
                onAddItem={onAddItem}
                onUpdateItem={onUpdateItem}
                onDeleteItem={onDeleteItem}
                onBlur={onBlur}
                currency={currency}
              />
            ))}
          </tbody>
        </table>

        {sections.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t("editor.noSections")}
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" className="gap-2" onClick={onAddSection}>
        <Plus className="size-4" />
        {t("editor.addSection")}
      </Button>
    </div>
  );
}
