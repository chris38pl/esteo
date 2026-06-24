"use client";

import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TemplateToolsMenuProps {
  advancedMode: boolean;
  onAdvancedModeChange: (value: boolean) => void;
  triggerButtonClassName?: string;
}

const defaultTriggerButtonClassName =
  "size-8 shrink-0 rounded-md border-blue-200 text-blue-600 shadow-xs hover:bg-blue-50 dark:border-input dark:text-foreground dark:hover:bg-accent";

export function TemplateToolsMenu({
  advancedMode,
  onAdvancedModeChange,
  triggerButtonClassName,
}: TemplateToolsMenuProps) {
  const t = useTranslations("estimates");
  const modeValue = advancedMode ? "advanced" : "basic";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("editor.mobile.toolsMenu")}
          className={cn(defaultTriggerButtonClassName, triggerButtonClassName)}
        >
          <Settings className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          {t("editor.mobile.toolsMenu")}
        </DropdownMenuLabel>
        <DropdownMenuLabel className="pt-1 text-[11px] font-medium text-muted-foreground/80">
          {t("editor.mobile.viewMode")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={modeValue}
          onValueChange={(next) => onAdvancedModeChange(next === "advanced")}
        >
          <DropdownMenuRadioItem value="basic" className="gap-2">
            {t("editor.mobile.basicView")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="advanced" className="gap-2">
            {t("editor.mobile.advancedView")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
