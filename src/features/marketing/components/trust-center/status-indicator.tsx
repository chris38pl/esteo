import type { ComponentStatus } from "@/features/marketing/content/status.config";
import { cn } from "@/lib/utils";

const statusDotClass: Record<ComponentStatus, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  outage: "bg-red-500",
  maintenance: "bg-sky-500",
};

type StatusIndicatorProps = {
  status: ComponentStatus;
  label: string;
  className?: string;
  align?: "start" | "end";
};

export function StatusIndicator({
  status,
  label,
  className,
  align = "start",
}: StatusIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm",
        align === "end" && "justify-end",
        className,
      )}
    >
      <span
        className={cn("size-2.5 shrink-0 rounded-full", statusDotClass[status])}
        aria-hidden
      />
      <span className="text-foreground">{label}</span>
    </span>
  );
}
