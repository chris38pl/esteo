"use client";

import { useEffect, useState } from "react";
import { GripVertical, MoreHorizontal, Trash2 } from "lucide-react";
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
import {
  estimateFlatInputClassName,
  estimateLineItemRowClassName,
} from "./estimate-table-input-styles";

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
  positionLabel: string;
  marginPercent: number;
  onUpdate: (id: string, data: Partial<Omit<LineItemData, "id" | "sortOrder">>) => void;
  onDelete: (id: string) => void;
  onBlur: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragHandleStart: () => void;
  onDragHandleEnd: () => void;
  onDragOverRow: () => void;
  onDragLeaveRow: () => void;
  onDropOnRow: () => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function EstimateLineItemRow({
  item,
  positionLabel,
  marginPercent,
  onUpdate,
  onDelete,
  onBlur,
  isDragging = false,
  isDragOver = false,
  onDragHandleStart,
  onDragHandleEnd,
  onDragOverRow,
  onDragLeaveRow,
  onDropOnRow,
}: EstimateLineItemRowProps) {
  const t = useTranslations("estimates");
  const [local, setLocal] = useState<LineItemData>(item);

  useEffect(() => {
    setLocal(item);
  }, [item]);

  const calc = calculateLineItem({
    quantity: local.quantity,
    unitPrice: local.unitPrice,
    vatRate: local.vatRate,
  });

  const handleChange = <K extends keyof LineItemData>(key: K, raw: string) => {
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

  const cellClass = "px-2 py-1.5 align-middle";

  return (
    <tr
      className={cn(
        estimateLineItemRowClassName,
        isDragging && "opacity-50",
        isDragOver && "bg-muted/40 dark:bg-muted/20",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOverRow();
      }}
      onDragLeave={onDragLeaveRow}
      onDrop={(event) => {
        event.preventDefault();
        onDropOnRow();
      }}
    >
      <td className={cn(cellClass, "w-9")}>
        <button
          type="button"
          draggable
          className="flex size-8 cursor-grab items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted/50 active:cursor-grabbing"
          aria-label={t("editor.dragHandle")}
          onDragStart={onDragHandleStart}
          onDragEnd={onDragHandleEnd}
        >
          <GripVertical className="size-4 shrink-0" strokeWidth={1.75} />
        </button>
      </td>
      <td
        className={cn(
          cellClass,
          "w-14 text-xs font-medium tabular-nums text-muted-foreground",
        )}
      >
        {positionLabel}
      </td>
      <td className={cellClass}>
        <Input
          value={local.name}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={onBlur}
          className={estimateFlatInputClassName}
          placeholder={t("editor.itemNamePlaceholder")}
        />
      </td>
      <td className={cn(cellClass, "w-20")}>
        <Input
          value={local.unit ?? ""}
          onChange={(e) => handleChange("unit", e.target.value)}
          onBlur={onBlur}
          className={estimateFlatInputClassName}
          placeholder={t("editor.unitPlaceholder")}
        />
      </td>
      <td className={cn(cellClass, "w-20")}>
        <Input
          type="number"
          min={0}
          value={local.quantity}
          onChange={(e) => handleChange("quantity", e.target.value)}
          onBlur={onBlur}
          className={cn(estimateFlatInputClassName, "text-right")}
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
          className={cn(estimateFlatInputClassName, "text-right")}
        />
      </td>
      <td className={cn(cellClass, "w-28 text-right text-sm tabular-nums")}>
        {formatCurrency(calc.netValue)}
      </td>
      <td
        className={cn(
          cellClass,
          "w-20 text-right text-sm tabular-nums text-muted-foreground",
        )}
      >
        {marginPercent > 0 ? `${marginPercent}%` : "—"}
      </td>
      <td className={cn(cellClass, "w-16")}>
        <Input
          type="number"
          min={0}
          max={100}
          step={1}
          value={(local.vatRate * 100).toFixed(0)}
          onChange={(e) => handleChange("vatRate", e.target.value)}
          onBlur={onBlur}
          className={cn(estimateFlatInputClassName, "text-right")}
        />
      </td>
      <td className={cn(cellClass, "w-28 text-right text-sm font-medium tabular-nums")}>
        {formatCurrency(calc.grossValue)}
      </td>
      <td className={cn(cellClass, "w-10")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 rounded-md opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onDelete(item.id)}
              className="gap-2 text-destructive"
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
