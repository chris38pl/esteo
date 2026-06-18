"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useGlobalSearch } from "./global-search-provider";

function shortcutLabel(): string {
  if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)) {
    return "⌘K";
  }
  return "Ctrl+K";
}

export function NavbarSearchButton() {
  const t = useTranslations("search");
  const { setOpen } = useGlobalSearch();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("navbar.label")}
            className="size-9 shrink-0 rounded-lg border-border/60 bg-card/40 text-muted-foreground shadow-none hover:bg-accent/50 hover:text-foreground"
            onClick={() => setOpen(true)}
          >
            <Search className="size-4" strokeWidth={1.75} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t("navbar.label")} ({shortcutLabel()})
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
