import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const severityClass: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  HIGH: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export function OpsCaseSeverityBadge({
  severity,
  label,
  className,
}: {
  severity: string;
  label: string;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("border-transparent", severityClass[severity], className)}>
      {label}
    </Badge>
  );
}
