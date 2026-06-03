"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { calculateLineItem } from "@/features/estimates/lib/calculate-estimate";

export interface LineItemData {
  id: string;
  name: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  sortOrder: number;
}

interface EstimateLineItemRowProps {
  item: LineItemData;
  index: number;
  onUpdate: (id: string, data: Partial<Omit<LineItemData, "id" | "sortOrder">>) => void;
  onDelete: (id: string) => void;
  onBlur: () => void;
  currency?: string;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function EstimateLineItemRow({
  item,
  index,
  onUpdate,
  onDelete,
  onBlur,
  currency = "PLN",
}: EstimateLineItemRowProps) {
  const t = useTranslations("estimates");
  const [local, setLocal] = useState<LineItemData>(item);

  const calc = calculateLineItem({
    quantity: local.quantity,
    unitPrice: local.unitPrice,
    vatRate: local.vatRate,
  });

  const handleChange = <K extends keyof LineItemData>(
    key: K,
    raw: string,
  ) => {
    let value: LineItemData[K];
    if (key === "quantity" || key === "unitPrice") {
      value = (parseFloat(raw) || 0) as LineItemData[K];
    } else if (key === "vatRate") {
      value = (parseFloat(raw) / 100 || 0) as LineItemData[K];
    } else {
      value = raw as LineItemData[K];
    }
    const updated = { ...local, [key]: value };
    setLocal(updated);
    onUpdate(item.id, { [key]: value });
  };

  const cellClass = "px-2 py-1";
  const inputClass = "h-7 min-w-0 border-transparent bg-transparent px-1 text-sm shadow-none focus:border-input focus:bg-background focus:shadow-sm";

  return (
    <tr className="group border-b hover:bg-muted/30 transition-colors">
      <td className={cn(cellClass, "w-8 text-center text-xs text-muted-foreground")}>
        {index + 1}
      </td>
      <td className={cellClass}>
        <Input
          value={local.name}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={onBlur}
          className={inputClass}
          placeholder="Item name"
        />
      </td>
      <td className={cn(cellClass, "w-20")}>
        <Input
          value={local.unit ?? ""}
          onChange={(e) => handleChange("unit", e.target.value)}
          onBlur={onBlur}
          className={inputClass}
          placeholder="unit"
        />
      </td>
      <td className={cn(cellClass, "w-20")}>
        <Input
          type="number"
          min={0}
          value={local.quantity}
          onChange={(e) => handleChange("quantity", e.target.value)}
          onBlur={onBlur}
          className={cn(inputClass, "text-right")}
        />
      </td>
      <td className={cn(cellClass, "w-28")}>
        <Input
          type="number"
          min={0}
          step={0.01}
          value={local.unitPrice}
          onChange={(e) => handleChange("unitPrice", e.target.value)}
          onBlur={onBlur}
          className={cn(inputClass, "text-right")}
        />
      </td>
      <td className={cn(cellClass, "w-24 text-right text-sm tabular-nums")}>
        {formatCurrency(calc.netValue)}
      </td>
      <td className={cn(cellClass, "w-20")}>
        <Input
          type="number"
          min={0}
          max={100}
          step={1}
          value={(local.vatRate * 100).toFixed(0)}
          onChange={(e) => handleChange("vatRate", e.target.value)}
          onBlur={onBlur}
          className={cn(inputClass, "text-right")}
        />
      </td>
      <td className={cn(cellClass, "w-28 text-right text-sm tabular-nums")}>
        {formatCurrency(calc.grossValue)}
      </td>
      <td className={cn(cellClass, "w-10")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onDelete(item.id)}
              className="text-destructive gap-2"
            >
              <Trash2 className="size-4" />
              {t("editor.deleteItem")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
