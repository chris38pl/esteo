import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardPanelCardProps {
  title: string;
  headerAction?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function DashboardPanelCard({
  title,
  headerAction,
  children,
  footer,
  className,
}: DashboardPanelCardProps) {
  return (
    <section className={cn("surface-card flex min-h-0 flex-col overflow-hidden", className)}>
      <header className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </header>

      <div className="min-h-0 flex-1">{children}</div>

      {footer ? (
        <footer className="border-t border-border/60 px-5 py-4">{footer}</footer>
      ) : null}
    </section>
  );
}
