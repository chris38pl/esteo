"use client";

import type { EstimateRequestStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const REQUEST_STATUS_STYLES: Record<EstimateRequestStatus, string> = {
  PENDING:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
  PROCESSING:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300",
  COMPLETED:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  FAILED:
    "border-red-500/20 bg-red-500/10 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300",
};

export function RequestStatusBadge({
  status,
  label,
  className,
}: {
  status: EstimateRequestStatus;
  label: string;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-md border px-2 py-0.5 text-[11px] font-medium",
        REQUEST_STATUS_STYLES[status],
        className,
      )}
    >
      {label}
    </Badge>
  );
}
