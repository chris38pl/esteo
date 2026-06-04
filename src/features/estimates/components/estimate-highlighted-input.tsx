"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { splitSearchHighlight } from "@/features/estimates/lib/split-search-highlight";
import { cn } from "@/lib/utils";

type EstimateHighlightedInputProps = ComponentProps<typeof Input> & {
  searchQuery: string;
};

export function EstimateHighlightedInput({
  searchQuery,
  className,
  value,
  ...props
}: EstimateHighlightedInputProps) {
  const text = String(value ?? "");
  const parts = splitSearchHighlight(text, searchQuery);
  const hasHighlight = searchQuery.trim().length > 0;

  return (
    <div className="relative min-w-0">
      {hasHighlight ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center overflow-hidden px-1 text-sm",
            className,
          )}
        >
          <span className="min-w-0 truncate whitespace-pre">
            {parts.map((part, index) =>
              part.match ? (
                <mark
                  key={index}
                  className="rounded-sm bg-blue-200/80 text-foreground dark:bg-blue-500/35 dark:text-inherit"
                >
                  {part.text}
                </mark>
              ) : (
                <span key={index}>{part.text}</span>
              ),
            )}
          </span>
        </div>
      ) : null}
      <Input
        {...props}
        value={value}
        className={cn(
          className,
          hasHighlight &&
            "relative bg-transparent text-transparent caret-foreground selection:bg-primary/25 selection:text-transparent",
        )}
      />
    </div>
  );
}
