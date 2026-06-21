import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const sourceClass: Record<string, string> = {
  REFERRAL_SERVICE: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  RECONCILIATION_CRON: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  STRIPE_WEBHOOK: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
  MANUAL: "bg-muted text-muted-foreground",
};

export function OpsCaseSourceBadge({
  source,
  label,
  className,
}: {
  source: string;
  label: string;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("border-transparent", sourceClass[source], className)}>
      {label}
    </Badge>
  );
}
