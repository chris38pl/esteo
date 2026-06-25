"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PriceListItemDraft } from "@/features/price-lists/lib/price-list-editor-draft";
import { PRICE_LIST_MAX_ITEMS } from "@/features/price-lists/lib/price-list-limits";
import type { TemplateAutoSaveStatus } from "@/features/estimate-templates/hooks/use-template-autosave";
import { cn } from "@/lib/utils";

interface PriceListItemsViewProps {
  items: PriceListItemDraft[];
  readOnly: boolean;
  autosaveStatus: TemplateAutoSaveStatus;
  onAddItem: () => void;
  onUpdateItem: (
    itemId: string,
    data: Partial<Pick<PriceListItemDraft, "name" | "unit" | "unitPrice" | "vatRate" | "note">>,
  ) => void;
  onDeleteItem: (itemId: string) => void;
  onBlur: () => void | Promise<void>;
}

export function PriceListItemsView({
  items,
  readOnly,
  autosaveStatus,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onBlur,
}: PriceListItemsViewProps) {
  const t = useTranslations("workspaces.configuration.priceLists.editor");
  const tDialog = useTranslations("workspaces.configuration.priceLists.dialog");

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 md:px-5">
        <p className="text-sm font-medium text-foreground">{tDialog("items")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={readOnly || items.length >= PRICE_LIST_MAX_ITEMS || autosaveStatus === "saving"}
          onClick={onAddItem}
        >
          <Plus className="size-4" />
          {tDialog("addItem")}
        </Button>
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[min(28%,14rem)]">{tDialog("itemName")}</TableHead>
              <TableHead className="w-24">{tDialog("unit")}</TableHead>
              <TableHead className="w-28">{tDialog("unitPrice")}</TableHead>
              <TableHead className="w-24">{tDialog("vatRate")}</TableHead>
              <TableHead>{tDialog("note")}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Input
                    value={item.name}
                    disabled={readOnly}
                    placeholder={t("itemNamePlaceholder")}
                    onBlur={() => void onBlur()}
                    onChange={(event) => onUpdateItem(item.id, { name: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.unit}
                    disabled={readOnly}
                    placeholder={t("unitPlaceholder")}
                    onBlur={() => void onBlur()}
                    onChange={(event) => onUpdateItem(item.id, { unit: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.unitPrice}
                    disabled={readOnly}
                    placeholder={t("unitPricePlaceholder")}
                    onBlur={() => void onBlur()}
                    onChange={(event) => onUpdateItem(item.id, { unitPrice: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.vatRate}
                    disabled={readOnly}
                    placeholder={t("vatRatePlaceholder")}
                    onBlur={() => void onBlur()}
                    onChange={(event) => onUpdateItem(item.id, { vatRate: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.note}
                    disabled={readOnly}
                    placeholder={t("notePlaceholder")}
                    onBlur={() => void onBlur()}
                    onChange={(event) => onUpdateItem(item.id, { note: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    disabled={readOnly || items.length <= 1}
                    aria-label={tDialog("removeItem")}
                    onClick={() => onDeleteItem(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn("space-y-3 rounded-lg border border-border/70 p-3", index > 0 && "")}
          >
            <Input
              value={item.name}
              disabled={readOnly}
              placeholder={t("itemNamePlaceholder")}
              onBlur={() => void onBlur()}
              onChange={(event) => onUpdateItem(item.id, { name: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={item.unit}
                disabled={readOnly}
                placeholder={t("unitPlaceholder")}
                onBlur={() => void onBlur()}
                onChange={(event) => onUpdateItem(item.id, { unit: event.target.value })}
              />
              <Input
                value={item.unitPrice}
                disabled={readOnly}
                placeholder={t("unitPricePlaceholder")}
                onBlur={() => void onBlur()}
                onChange={(event) => onUpdateItem(item.id, { unitPrice: event.target.value })}
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input
                value={item.vatRate}
                disabled={readOnly}
                placeholder={t("vatRatePlaceholder")}
                onBlur={() => void onBlur()}
                onChange={(event) => onUpdateItem(item.id, { vatRate: event.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 shrink-0"
                disabled={readOnly || items.length <= 1}
                aria-label={tDialog("removeItem")}
                onClick={() => onDeleteItem(item.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <Input
              value={item.note}
              disabled={readOnly}
              placeholder={t("notePlaceholder")}
              onBlur={() => void onBlur()}
              onChange={(event) => onUpdateItem(item.id, { note: event.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
