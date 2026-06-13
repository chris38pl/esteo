"use client";

import { Loader2, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

interface EstimateMobileAddRowProps {
  label: string;
  pendingLabel?: string;
  onClick: () => void;
  variant: "section" | "item";
  className?: string;
  disabled?: boolean;
  isPending?: boolean;
}

export function EstimateMobileAddRow({
  label,
  pendingLabel,
  onClick,
  variant,
  className,
  disabled = false,
  isPending = false,
}: EstimateMobileAddRowProps) {
  const isDisabled = disabled || isPending;
  const displayLabel = isPending && pendingLabel ? pendingLabel : label;

  if (variant === "section") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl border border-border/50 bg-card/40 px-3 py-2.5 text-left text-sm text-muted-foreground opacity-70 transition-opacity hover:opacity-90 active:bg-muted/15 disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60">
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Plus className="size-3.5" strokeWidth={2} />
          )}
        </span>
        <span className="font-medium">{displayLabel}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "flex w-full items-center gap-2 border-t border-border/40 px-3 py-2.5 text-left text-xs text-muted-foreground opacity-70 transition-opacity hover:opacity-90 active:bg-muted/15 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border/60">
        {isPending ? (
          <Loader2 className="size-3 animate-spin" strokeWidth={2} />
        ) : (
          <Plus className="size-3" strokeWidth={2} />
        )}
      </span>
      <span className="font-medium">{displayLabel}</span>
    </button>
  );
}
