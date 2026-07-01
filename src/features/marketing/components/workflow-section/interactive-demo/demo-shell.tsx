"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DemoShell({
  children,
  label,
  className,
  bleed = false,
}: {
  children: ReactNode;
  label: string;
  className?: string;
  bleed?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.65)] backdrop-blur-sm",
        className,
      )}
      aria-label={label}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border/40 bg-background/60 px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="mx-auto hidden h-6 min-w-0 max-w-[14rem] flex-1 rounded-md bg-muted/40 px-3 sm:block">
          <span className="block truncate text-center text-[10px] leading-6 text-muted-foreground">
            www.esteo.app
          </span>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <div
          className={cn(
            "relative flex-1",
            bleed
              ? "min-h-[18rem] overflow-hidden p-0 sm:min-h-0"
              : "min-h-[20rem] overflow-hidden p-4 sm:min-h-[22rem] sm:p-5 lg:min-h-0 lg:p-6",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
