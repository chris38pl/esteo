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
import {
  estimateLineItemFlatInputClassName,
  estimateLineItemRowClassName,
} from "@/features/estimates/components/estimate-table-input-styles";
import type { TemplateItemDraft } from "@/features/estimate-templates/lib/template-editor-draft";
import { normalizeTemplateDecimalInput } from "@/features/estimate-templates/lib/template-pricing";

type TemplateItemEditableFields = Pick<
  TemplateItemDraft,
  "name" | "unit" | "unitPrice" | "vatRate" | "note"
>;

interface TemplateLineItemRowProps {
  item: TemplateItemDraft;
  positionLabel: string;
  currency: string;
  onUpdate: (id: string, data: Partial<TemplateItemEditableFields>) => void;
  onDelete: (id: string) => void;
  onBlur: () => void | Promise<void>;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragHandleStart: () => void;
  onDragHandleEnd: () => void;
  onDragOverRow: () => void;
  onDragLeaveRow: () => void;
  onDropOnRow: () => void;
}

export function TemplateLineItemRow({
  item,
  positionLabel,
  currency,
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
}: TemplateLineItemRowProps) {
  const t = useTranslations("workspaces.configuration.templates.editor");
  const tEst = useTranslations("estimates");
  const [local, setLocal] = useState(item);

  useEffect(() => {
    setLocal(item);
  }, [item]);

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
      <td className={`${cellClass} w-9`}>
        <button
          type="button"
          draggable
          className="flex size-8 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 active:cursor-grabbing"
          aria-label={tEst("editor.dragHandle")}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            onDragHandleStart();
          }}
          onDragEnd={onDragHandleEnd}
        >
          <GripVertical className="size-4" />
        </button>
      </td>
      <td className={`${cellClass} w-14 text-xs tabular-nums text-muted-foreground`}>
        {positionLabel}
      </td>
      <td className={`${cellClass} max-w-0`}>
        <Input
          value={local.name}
          onChange={(event) => {
            const name = event.target.value;
            setLocal((prev) => ({ ...prev, name }));
            onUpdate(item.id, { name });
          }}
          onBlur={onBlur}
          placeholder={t("itemNamePlaceholder")}
          className={cn(estimateLineItemFlatInputClassName, "w-full min-w-0")}
        />
      </td>
      <td className={`${cellClass} max-w-0`}>
        <Input
          value={local.unit}
          onChange={(event) => {
            const unit = event.target.value;
            setLocal((prev) => ({ ...prev, unit }));
            onUpdate(item.id, { unit });
          }}
          onBlur={onBlur}
          placeholder={t("unitPlaceholder")}
          className={cn(estimateLineItemFlatInputClassName, "w-full min-w-0 px-0.5")}
        />
      </td>
      <td className={`${cellClass} max-w-0`}>
        <div className="relative min-w-0">
          <Input
            value={local.unitPrice}
            inputMode="decimal"
            onChange={(event) => {
              const unitPrice = event.target.value;
              setLocal((prev) => ({ ...prev, unitPrice }));
              onUpdate(item.id, { unitPrice });
            }}
            onBlur={() => {
              const normalized = normalizeTemplateDecimalInput(local.unitPrice);
              if (normalized !== local.unitPrice) {
                setLocal((prev) => ({ ...prev, unitPrice: normalized }));
                onUpdate(item.id, { unitPrice: normalized });
              }
              void onBlur();
            }}
            placeholder={t("unitPricePlaceholder")}
            className={cn(estimateLineItemFlatInputClassName, "w-full min-w-0 pr-8")}
          />
          <span className="pointer-events-none absolute inset-y-0 right-0.5 flex items-center text-[10px] font-medium text-muted-foreground">
            {currency}
          </span>
        </div>
      </td>
      <td className={`${cellClass} max-w-0`}>
        <Input
          value={local.vatRate}
          inputMode="decimal"
          onChange={(event) => {
            const vatRate = event.target.value;
            setLocal((prev) => ({ ...prev, vatRate }));
            onUpdate(item.id, { vatRate });
          }}
          onBlur={() => {
            const normalized = normalizeTemplateDecimalInput(local.vatRate);
            if (normalized !== local.vatRate) {
              setLocal((prev) => ({ ...prev, vatRate: normalized }));
              onUpdate(item.id, { vatRate: normalized });
            }
            void onBlur();
          }}
          placeholder={t("vatRatePlaceholder")}
          className={cn(estimateLineItemFlatInputClassName, "w-full min-w-0 px-0.5")}
        />
      </td>
      <td className={`${cellClass} w-10`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDelete(item.id)} className="gap-2 text-destructive">
              <Trash2 className="size-4" />
              {tEst("editor.deleteItem")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
