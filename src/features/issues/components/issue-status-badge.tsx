import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusClass: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  IN_PROGRESS: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  ON_HOLD: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  RESOLVED: "bg-muted text-muted-foreground",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export function IssueStatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label: string;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("border-transparent", statusClass[status], className)}>
      {label}
    </Badge>
  );
}
