"use client";

import { useEffect, useState } from "react";
import { Minus, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  calculateEstimate,
  type LineItemCalcInput,
} from "@/features/estimates/lib/calculate-estimate";
import {
  estimateFlatInputClassName,
  estimateSectionRowClassName,
} from "./estimate-table-input-styles";
import type { LineItemData } from "./estimate-line-item-row";

interface EstimateSectionRowProps {
  id: string;
  title: string;
  items: LineItemData[];
  sectionNumber: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  onUpdateSection: (id: string, title: string) => void;
  onDeleteSection: (id: string) => void;
  onAddItem: (sectionId: string) => void;
  onBlur: () => void | Promise<void>;
  currency?: string;
  titleColSpan: number;
}

function formatCurrency(value: number, currency: string): string {
  return (
    value.toLocaleString("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " " + currency
  );
}

export function EstimateSectionRow({
  id,
  title,
  items,
  sectionNumber,
  expanded,
  onToggleExpanded,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  onBlur,
  currency = "PLN",
  titleColSpan,
}: EstimateSectionRowProps) {
  const t = useTranslations("estimates");
  const [localTitle, setLocalTitle] = useState(title);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  const calcInputs: LineItemCalcInput[] = items.map((i) => ({
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    vatRate: i.vatRate,
  }));
  const sectionCalc = calculateEstimate(calcInputs, 0);

  return (
    <tr className={estimateSectionRowClassName} data-estimate-section-id={id}>
      <td className="w-9 px-2 py-2.5 align-middle">
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8 rounded-md text-muted-foreground hover:bg-muted/80"
          onClick={onToggleExpanded}
          aria-label={expanded ? t("editor.collapseSection") : t("editor.expandSection")}
        >
          {expanded ? <Minus className="size-4" /> : <Plus className="size-4" />}
        </Button>
      </td>
      <td className="w-14 px-2 py-2.5 align-middle text-xs font-semibold text-muted-foreground">
        {sectionNumber}
      </td>
      <td colSpan={titleColSpan} className="px-2 py-2.5 align-middle">
        <Input
          value={localTitle}
          onChange={(e) => {
            setLocalTitle(e.target.value);
            onUpdateSection(id, e.target.value);
          }}
          onBlur={onBlur}
          className={`${estimateFlatInputClassName} px-0 font-semibold`}
        />
      </td>
      <td className="px-3 py-2.5 text-right text-sm font-semibold tabular-nums">
        {formatCurrency(sectionCalc.totalNet, currency)}
      </td>
      <td className="px-3 py-2.5 text-right text-sm font-semibold tabular-nums">
        {formatCurrency(sectionCalc.totalVat, currency)}
      </td>
      <td className="px-3 py-2.5 text-right text-sm font-semibold tabular-nums">
        {formatCurrency(sectionCalc.totalGross, currency)}
      </td>
      <td className="w-10 px-2 py-2.5 align-middle">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 rounded-md text-muted-foreground"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAddItem(id)} className="gap-2">
              <Plus className="size-4" />
              {t("editor.addItem")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteSection(id)}
              className="gap-2 text-destructive"
            >
              <Trash2 className="size-4" />
              {t("editor.deleteSection")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
