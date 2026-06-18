"use client";

import type { EstimateVersionStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const ESTIMATE_LIST_STATUS_STYLES: Record<
  EstimateVersionStatus | "ARCHIVED",
  string
> = {
  DRAFT:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300",
  SENT:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  ACCEPTED:
    "border-green-500/20 bg-green-500/10 text-green-700 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-300",
  REJECTED:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300",
  ARCHIVED:
    "border-border bg-muted/50 text-muted-foreground dark:border-border dark:bg-muted/30",
};

export function EstimateListStatusBadge({
  status,
  label,
  className,
}: {
  status: EstimateVersionStatus | "ARCHIVED";
  label: string;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        ESTIMATE_LIST_STATUS_STYLES[status],
        className,
      )}
    >
      {label}
    </Badge>
  );
}
