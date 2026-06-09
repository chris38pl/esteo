import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EstimateSummarySectionHeaderProps {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
  className?: string;
}

export function EstimateSummarySectionHeader({
  icon: Icon,
  title,
  action,
  className,
}: EstimateSummarySectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-5 py-4", className)}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/10">
          <Icon className="size-5" />
        </span>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}
