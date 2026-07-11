"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { TemplateItemDraft } from "@/features/estimate-templates/lib/template-editor-draft";

interface TemplateMobilePositionCardProps {
  item: TemplateItemDraft;
  positionLabel: string;
  currency: string;
  onOpen: () => void;
}

function TemplateMobilePositionCardComponent({
  item,
  positionLabel,
  currency,
  onOpen,
}: TemplateMobilePositionCardProps) {
  const t = useTranslations("workspaces.configuration.templates.editor");

  const priceLabel =
    item.unitPrice.trim().length > 0
      ? `${item.unitPrice} ${currency}`
      : t("unitPricePlaceholder");

  return (
    <div
      className={cn(
        "group relative border-b border-border/40 last:border-b-0",
        "transition-colors active:bg-muted/20",
      )}
    >
      <button
        type="button"
        className="flex w-full min-w-0 gap-2 px-3 py-2.5 text-left"
        onClick={onOpen}
      >
        <span className="w-7 shrink-0 pt-px text-xs font-medium tabular-nums text-muted-foreground">
          {positionLabel}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
              {item.name || t("itemNamePlaceholder")}
            </span>
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs tabular-nums text-muted-foreground">
            <span>{item.unit || "-"}</span>
            <span>{priceLabel}</span>
          </span>
        </span>
      </button>
    </div>
  );
}

export const TemplateMobilePositionCard = memo(TemplateMobilePositionCardComponent);
