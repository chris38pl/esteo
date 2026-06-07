"use client";

import { Filter, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EstimateTableFilterButtonProps {
  active: boolean;
  onClick: () => void;
  onClear: () => void;
  className?: string;
}

export function EstimateTableFilterButton({
  active,
  onClick,
  onClear,
  className,
}: EstimateTableFilterButtonProps) {
  const t = useTranslations("estimates");

  return (
    <div className={cn("relative shrink-0", className)}>
      <Button
        type="button"
        variant={active ? "default" : "outline"}
        size="icon"
        aria-label={t("editor.toolbar.filter")}
        className={cn(
          "size-full rounded-md shadow-xs",
          active
            ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
            : "border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-input dark:text-foreground dark:hover:bg-accent",
        )}
        onClick={onClick}
      >
        <Filter className="size-4" />
      </Button>

      {active ? (
        <button
          type="button"
          className="absolute -right-0.5 -bottom-0.5 z-10 flex size-3.5 items-center justify-center rounded-full border border-primary bg-primary-foreground text-primary shadow-sm transition-colors hover:bg-primary-foreground/90"
          aria-label={t("editor.filter.clear")}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClear();
          }}
        >
          <X className="size-2.5" strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}
