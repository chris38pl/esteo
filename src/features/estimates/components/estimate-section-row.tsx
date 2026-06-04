"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { calculateEstimate, type LineItemCalcInput } from "@/features/estimates/lib/calculate-estimate";
import { EstimateLineItemRow, type LineItemData } from "./estimate-line-item-row";

interface EstimateSectionRowProps {
  id: string;
  title: string;
  items: LineItemData[];
  sectionNumber: number;
  onUpdateSection: (id: string, title: string) => void;
  onDeleteSection: (id: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (itemId: string, data: Partial<Omit<LineItemData, "id" | "sortOrder">>) => void;
  onDeleteItem: (itemId: string) => void;
  onBlur: () => void;
  currency?: string;
}

function formatCurrency(value: number, currency: string): string {
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " " + currency;
}

export function EstimateSectionRow({
  id,
  title,
  items,
  sectionNumber,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onBlur,
  currency = "PLN",
}: EstimateSectionRowProps) {
  const t = useTranslations("estimates");
  const [expanded, setExpanded] = useState(true);
  const [localTitle, setLocalTitle] = useState(title);

  const calcInputs: LineItemCalcInput[] = items.map((i) => ({
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    vatRate: i.vatRate,
  }));
  const sectionCalc = calculateEstimate(calcInputs, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b bg-muted/20 px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8 rounded-xl"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? t("editor.collapseSection") : t("editor.expandSection")}
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
            {sectionNumber}
          </span>
          <Input
            value={localTitle}
            onChange={(e) => {
              setLocalTitle(e.target.value);
              onUpdateSection(id, e.target.value);
            }}
            onBlur={onBlur}
            className="h-9 min-w-48 border-transparent bg-transparent px-0 text-base font-semibold shadow-none focus:border-transparent focus:bg-transparent focus-visible:ring-0"
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            {t("editor.itemCount", { count: items.length })}
          </span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
            {t("editor.sectionNet", {
              amount: formatCurrency(sectionCalc.totalNet, currency),
            })}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="rounded-xl">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onAddItem(id)}
                className="gap-2"
              >
                <Plus className="size-4" />
                {t("editor.addItem")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteSection(id)}
                className="text-destructive gap-2"
              >
                <Trash2 className="size-4" />
                {t("editor.deleteSection")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <th className="w-10 px-3 py-3 text-center">{t("editor.columns.no")}</th>
                <th className="px-3 py-3 text-left">{t("editor.columns.name")}</th>
                <th className="w-20 px-3 py-3 text-left">{t("editor.columns.unit")}</th>
                <th className="w-20 px-3 py-3 text-right">{t("editor.columns.qty")}</th>
                <th className="w-28 px-3 py-3 text-right">{t("editor.columns.unitPrice")}</th>
                <th className="w-28 px-3 py-3 text-right">{t("editor.columns.net")}</th>
                <th className="w-20 px-3 py-3 text-right">{t("editor.columns.vat")}</th>
                <th className="w-28 px-3 py-3 text-right">{t("editor.columns.gross")}</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((item, index) => (
                <EstimateLineItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  onUpdate={onUpdateItem}
                  onDelete={onDeleteItem}
                  onBlur={onBlur}
                />
              ))}

              <tr>
                <td colSpan={9} className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 rounded-xl text-xs text-primary hover:bg-primary/10 hover:text-primary"
                    onClick={() => onAddItem(id)}
                  >
                    <Plus className="size-3.5" />
                    {t("editor.addItem")}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
