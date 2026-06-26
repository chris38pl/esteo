"use client";

import { memo } from "react";
import { ChevronDown, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EstimateMobileAddRow } from "@/features/estimates/components/estimate-mobile-add-row";
import type { TemplateItemDraft } from "@/features/estimate-templates/lib/template-editor-draft";
import { TemplateMobilePositionCard } from "./template-mobile-position-card";

interface TemplateMobileSectionCardProps {
  sectionId: string;
  sectionNumber: number;
  title: string;
  guidance: string;
  items: TemplateItemDraft[];
  currency: string;
  advancedMode: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onEditSection: () => void;
  onAddItem: () => void;
  isAddingItem?: boolean;
  onDeleteSection: () => void;
  onOpenItem: (itemId: string) => void;
  canDeleteSection: boolean;
}

function TemplateMobileSectionCardComponent({
  sectionId,
  sectionNumber,
  title,
  items,
  currency,
  advancedMode,
  expanded,
  onToggleExpanded,
  onEditSection,
  onAddItem,
  isAddingItem = false,
  onDeleteSection,
  onOpenItem,
  canDeleteSection,
}: TemplateMobileSectionCardProps) {
  const t = useTranslations("estimates");
  const tTpl = useTranslations("workspaces.configuration.templates.editor");

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-sm">
      <div className="flex items-center gap-1.5 px-3 py-2.5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              !expanded && "-rotate-90",
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {sectionNumber}. {title || t("editor.newSection")}
            </p>
          </div>
          <p className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
            {tTpl("itemCountShort", { count: items.length })}
          </p>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8 shrink-0 rounded-lg text-muted-foreground"
              aria-label={t("editor.mobile.sectionActions")}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onAddItem} disabled={isAddingItem} className="gap-2">
              {isAddingItem ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {isAddingItem ? t("editor.addingItem") : t("editor.addItem")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEditSection} className="gap-2">
              <Pencil className="size-4" />
              {advancedMode ? tTpl("editSectionAdvanced") : t("editor.mobile.renameSection")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDeleteSection}
              disabled={!canDeleteSection}
              className="gap-2 text-destructive"
            >
              <Trash2 className="size-4" />
              {t("editor.deleteSection")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded ? (
        <div>
          {items.map((item, itemIndex) => (
            <TemplateMobilePositionCard
              key={item.id}
              item={item}
              positionLabel={`${sectionNumber}.${itemIndex + 1}`}
              currency={currency}
              onOpen={() => onOpenItem(item.id)}
            />
          ))}
          <EstimateMobileAddRow
            variant="item"
            label={t("editor.addItem")}
            pendingLabel={t("editor.addingItem")}
            onClick={onAddItem}
            isPending={isAddingItem}
            disabled={isAddingItem}
          />
        </div>
      ) : null}
    </section>
  );
}

export const TemplateMobileSectionCard = memo(TemplateMobileSectionCardComponent);
