"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface EstimateListContextCellProps {
  icon: LucideIcon;
  heading: string;
  primary: string;
  secondary: string;
  className?: string;
}

const iconClassName =
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10";

export function EstimateListContextCell({
  icon: Icon,
  heading,
  primary,
  secondary,
  className,
}: EstimateListContextCellProps) {
  return (
    <div
      className={cn(
        "flex min-w-[9.5rem] max-w-[11.5rem] shrink-0 items-center gap-2.5",
        className,
      )}
    >
      <span className={iconClassName}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {heading}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{primary}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{secondary}</p>
      </div>
    </div>
  );
}
