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
import { cn } from "@/lib/utils";
import { EstimateLineItemRow, type LineItemData } from "./estimate-line-item-row";

interface EstimateSectionRowProps {
  id: string;
  title: string;
  items: LineItemData[];
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
    <>
      <tr className="border-b bg-muted/20">
        <td colSpan={9} className="px-2 py-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
            </Button>
            <Input
              value={localTitle}
              onChange={(e) => {
                setLocalTitle(e.target.value);
                onUpdateSection(id, e.target.value);
              }}
              onBlur={onBlur}
              className="h-7 border-transparent bg-transparent px-1 text-sm font-semibold shadow-none focus:border-input focus:bg-background"
            />
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {t("editor.sectionNet", {
                amount: formatCurrency(sectionCalc.totalNet, currency),
              })}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs">
                  <MoreHorizontal className="size-3" />
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
        </td>
      </tr>

      {expanded &&
        items.map((item, index) => (
          <EstimateLineItemRow
            key={item.id}
            item={item}
            index={index}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
            onBlur={onBlur}
            currency={currency}
          />
        ))}

      {expanded && (
        <tr className={cn("border-b")}>
          <td colSpan={9} className="px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground"
              onClick={() => onAddItem(id)}
            >
              <Plus className="size-3" />
              {t("editor.addItem")}
            </Button>
          </td>
        </tr>
      )}
    </>
  );
}
