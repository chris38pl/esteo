"use client";

import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  estimatePrimaryButtonClassName,
} from "@/features/estimates/components/estimate-action-button-styles";
import { TemplateToolsMenu } from "./template-tools-menu";

interface TemplateItemsToolbarProps {
  advancedMode: boolean;
  onAdvancedModeChange: (value: boolean) => void;
  onAddSection: () => void;
  isAddingSection?: boolean;
}

export function TemplateItemsToolbar({
  advancedMode,
  onAdvancedModeChange,
  onAddSection,
  isAddingSection = false,
}: TemplateItemsToolbarProps) {
  const t = useTranslations("workspaces.configuration.templates.editor");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className={estimatePrimaryButtonClassName}
          onClick={onAddSection}
          disabled={isAddingSection}
        >
          {isAddingSection ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {isAddingSection ? t("addingSection") : t("addSection")}
        </Button>
      </div>

      <TemplateToolsMenu
        advancedMode={advancedMode}
        onAdvancedModeChange={onAdvancedModeChange}
      />
    </div>
  );
}
