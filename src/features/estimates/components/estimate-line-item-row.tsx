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
import { DecimalInput, PercentInput } from "@/components/ui/decimal-input";
import { EstimateHighlightedInput } from "./estimate-highlighted-input";
import { cn } from "@/lib/utils";
import { calculateLineItem } from "@/features/estimates/lib/calculate-estimate";
import { roundEstimateDecimal } from "@/features/estimates/lib/estimate-decimals";
import {
  estimateLineItemFlatInputClassName,
  estimateLineItemRowClassName,
} from "./estimate-table-input-styles";

export interface LineItemData {
  id: string;
  name: string;
  unit: string | null;
  quantity: number;
  baseUnitPrice: number;
  unitPrice: number;
  vatRate: number;
  sortOrder: number;
}

interface EstimateLineItemRowProps {
  item: LineItemData;
  positionLabel: string;
  advancedMode: boolean;
  onUpdate: (id: string, data: Partial<Omit<LineItemData, "id" | "sortOrder">>) => void;
  onDelete: (id: string) => void;
  onBlur: () => void | Promise<void>;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragHandleStart: () => void;
  onDragHandleEnd: () => void;
  onDragOverRow: () => void;
  onDragLeaveRow: () => void;
  onDropOnRow: () => void;
  searchQuery?: string;
  readOnly?: boolean;
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
  advancedMode,
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
  searchQuery = "",
  readOnly = false,
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

  const handleNumericChange = (
    key: "quantity" | "unitPrice" | "baseUnitPrice",
    value: number,
  ) => {
    const updated = { ...local, [key]: value };
    setLocal(updated);
    onUpdate(item.id, { [key]: value });
  };

  const handleChange = <K extends keyof LineItemData>(key: K, raw: string) => {
    const value = raw as LineItemData[K];
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
        {!readOnly ? (
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
        ) : null}
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
        <EstimateHighlightedInput
          value={local.name}
          searchQuery={searchQuery}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={onBlur}
          disabled={readOnly}
          className={estimateLineItemFlatInputClassName}
          placeholder={t("editor.itemNamePlaceholder")}
        />
      </td>
      <td className={cn(cellClass, "w-20")}>
        <EstimateHighlightedInput
          value={local.unit ?? ""}
          searchQuery={searchQuery}
          onChange={(e) => handleChange("unit", e.target.value)}
          onBlur={onBlur}
          disabled={readOnly}
          className={estimateLineItemFlatInputClassName}
          placeholder={t("editor.unitPlaceholder")}
        />
      </td>
      <td className={cn(cellClass, "w-20")}>
        <DecimalInput
          min={0}
          value={local.quantity}
          onValueChange={(value) => handleNumericChange("quantity", value)}
          onBlurCommit={() => {
            const rounded = roundEstimateDecimal(local.quantity);
            if (rounded !== local.quantity) {
              handleNumericChange("quantity", rounded);
            }
            void onBlur();
          }}
          disabled={readOnly}
          className={cn(estimateLineItemFlatInputClassName, "text-right tabular-nums")}
        />
      </td>
      {advancedMode ? (
        <td className={cn(cellClass, "w-28")}>
          <DecimalInput
            min={0}
            value={local.baseUnitPrice}
            onValueChange={(value) => handleNumericChange("baseUnitPrice", value)}
            onBlurCommit={() => {
              const rounded = roundEstimateDecimal(local.baseUnitPrice);
              if (rounded !== local.baseUnitPrice) {
                handleNumericChange("baseUnitPrice", rounded);
              }
              void onBlur();
            }}
            disabled={readOnly}
            className={cn(estimateLineItemFlatInputClassName, "text-right")}
          />
        </td>
      ) : null}
      <td className={cn(cellClass, "w-28")}>
        {advancedMode ? (
          <span className="block px-1 text-right text-sm tabular-nums text-muted-foreground">
            {formatCurrency(local.unitPrice)}
          </span>
        ) : (
          <DecimalInput
            min={0}
            value={local.unitPrice}
            onValueChange={(value) => handleNumericChange("unitPrice", value)}
            onBlurCommit={() => {
              const rounded = roundEstimateDecimal(local.unitPrice);
              if (rounded !== local.unitPrice) {
                handleNumericChange("unitPrice", rounded);
              }
              void onBlur();
            }}
            disabled={readOnly}
            className={cn(estimateLineItemFlatInputClassName, "text-right")}
          />
        )}
      </td>
      <td className={cn(cellClass, "w-28 text-right text-sm tabular-nums")}>
        {formatCurrency(calc.netValue)}
      </td>
      <td className={cn(cellClass, "w-16")}>
        <PercentInput
          value={local.vatRate}
          onValueChange={(value) => {
            const updated = { ...local, vatRate: value };
            setLocal(updated);
            onUpdate(item.id, { vatRate: value });
          }}
          onBlurCommit={() => void onBlur()}
          emptyZero={false}
          disabled={readOnly}
          className={cn(estimateLineItemFlatInputClassName, "text-right")}
        />
      </td>
      <td className={cn(cellClass, "w-28 text-right text-sm font-medium tabular-nums")}>
        {formatCurrency(calc.grossValue)}
      </td>
      <td className={cn(cellClass, "w-10")}>
        {!readOnly ? (
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
        ) : null}
      </td>
    </tr>
  );
}
