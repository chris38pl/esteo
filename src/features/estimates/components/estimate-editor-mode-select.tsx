"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { estimateOutlineButtonClassName } from "./estimate-action-button-styles";

interface EstimateEditorModeSelectProps {
  advancedMode: boolean;
  onModeChange: (advanced: boolean) => void;
}

export function EstimateEditorModeSelect({
  advancedMode,
  onModeChange,
}: EstimateEditorModeSelectProps) {
  const t = useTranslations("estimates");
  const value = advancedMode ? "advanced" : "basic";
  const modeLabel = advancedMode ? t("editor.mode.advanced") : t("editor.mode.basic");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={estimateOutlineButtonClassName}
          aria-label={t("editor.mode.label")}
        >
          {t("editor.mode.view", { mode: modeLabel })}
          <ChevronDown className="size-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onModeChange(next === "advanced")}
        >
          <DropdownMenuRadioItem value="basic">
            {t("editor.mode.basic")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="advanced">
            {t("editor.mode.advanced")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
