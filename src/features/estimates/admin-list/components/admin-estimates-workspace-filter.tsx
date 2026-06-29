"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { estimateOutlineButtonClassName } from "@/features/estimates/components/estimate-action-button-styles";
import type { AdminEstimateWorkspaceFilterOption } from "@/features/estimates/server/admin-estimates";
import { cn } from "@/lib/utils";

interface AdminEstimatesWorkspaceFilterProps {
  options: AdminEstimateWorkspaceFilterOption[];
  value: string | null;
  onChange: (workspaceId: string | null) => void;
}

export function AdminEstimatesWorkspaceFilter({
  options,
  value,
  onChange,
}: AdminEstimatesWorkspaceFilterProps) {
  const t = useTranslations("admin.estimates");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.id === value) ?? null;

  const filteredOptions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return options;
    }

    return options.filter((option) => {
      const ownerLabel = option.ownerName ?? option.ownerEmail;
      return (
        option.name.toLowerCase().includes(trimmed) ||
        option.slug.toLowerCase().includes(trimmed) ||
        ownerLabel.toLowerCase().includes(trimmed)
      );
    });
  }, [options, query]);

  const triggerLabel = selected?.name ?? t("workspaceFilter.all");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 min-w-[9rem] max-w-[14rem] justify-between rounded-md px-3 font-normal shadow-xs sm:min-w-[10rem]",
            estimateOutlineButtonClassName,
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-0">
        <div className="border-b border-border/60 p-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("workspaceFilter.searchPlaceholder")}
            className="h-9"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/60",
              value === null && "bg-muted/50",
            )}
            onClick={() => {
              onChange(null);
              setOpen(false);
              setQuery("");
            }}
          >
            <Check className={cn("size-4 shrink-0", value === null ? "opacity-100" : "opacity-0")} />
            <span>{t("workspaceFilter.all")}</span>
          </button>
          {filteredOptions.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">{t("workspaceFilter.empty")}</p>
          ) : (
            filteredOptions.map((option) => {
              const ownerLabel = option.ownerName ?? option.ownerEmail;
              const isSelected = value === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/60",
                    isSelected && "bg-muted/50",
                  )}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <Check
                    className={cn("mt-0.5 size-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{option.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {ownerLabel}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
