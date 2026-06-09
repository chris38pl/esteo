import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EstimateSummaryCardShellProps {
  title?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export function EstimateSummaryCardShell({
  title,
  children,
  className,
  headerAction,
}: EstimateSummaryCardShellProps) {
  return (
    <section
      className={cn(
        "flex h-full flex-col rounded-xl border border-border/70 bg-card/95 shadow-sm",
        className,
      )}
    >
      {title ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {headerAction}
        </div>
      ) : null}
      <div className={cn("flex min-h-0 flex-1 flex-col", !title && "pt-1")}>
        {children}
      </div>
    </section>
  );
}
