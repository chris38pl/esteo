"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EstimateTableSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  className?: string;
}

export function EstimateTableSearch({
  query,
  onQueryChange,
  className,
}: EstimateTableSearchProps) {
  const t = useTranslations("estimates");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setOpen(false);
    onQueryChange("");
  };

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("editor.toolbar.search")}
        className={cn(
          "size-9 shrink-0 rounded-md border-blue-200 text-blue-600 shadow-xs hover:bg-blue-50 dark:border-input dark:text-foreground dark:hover:bg-accent",
          open && "bg-accent",
          query.trim() && "ring-2 ring-primary/30",
        )}
        onClick={() => {
          if (!open) {
            setOpen(true);
            return;
          }
          inputRef.current?.focus();
        }}
      >
        <Search className="size-4" />
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label={t("editor.toolbar.search")}
          className="absolute top-full right-0 z-50 mt-1.5 w-[min(16rem,calc(100vw-2rem))] rounded-lg border border-border/80 bg-popover p-2 shadow-lg"
        >
          <div className="flex items-center gap-1.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={t("editor.toolbar.searchPlaceholder")}
              className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={t("editor.toolbar.searchClose")}
              onClick={close}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
