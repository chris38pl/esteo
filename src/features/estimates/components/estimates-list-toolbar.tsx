"use client";

import { Calendar, ChevronDown, Filter, Search, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { estimateOutlineButtonClassName } from "./estimate-action-button-styles";

interface EstimatesListToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export function EstimatesListToolbar({
  searchQuery,
  onSearchQueryChange,
}: EstimatesListToolbarProps) {
  const t = useTranslations("estimates");
  const comingSoon = t("editor.toolbar.comingSoon");

  return (
    <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={t("list.searchPlaceholder")}
          className="h-10 rounded-lg border-border/70 bg-background pl-9 shadow-xs"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={estimateOutlineButtonClassName}
          disabled
          title={comingSoon}
        >
          <Filter className="size-4" />
          {t("list.toolbar.filters")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={estimateOutlineButtonClassName}
          disabled
          title={comingSoon}
        >
          <Calendar className="size-4" />
          {t("list.toolbar.dateRange")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={estimateOutlineButtonClassName}
              disabled
              title={comingSoon}
            >
              {t("list.toolbar.more")}
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>{comingSoon}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-md border-blue-200 text-blue-600 shadow-xs hover:bg-blue-50 dark:border-input dark:text-foreground dark:hover:bg-accent"
          disabled
          aria-label={t("editor.toolbar.settings")}
          title={comingSoon}
        >
          <Settings className="size-4" />
        </Button>
      </div>
    </div>
  );
}
