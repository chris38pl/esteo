import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { DashboardSparkline } from "@/features/dashboard/components/dashboard-sparkline";
import { cn } from "@/lib/utils";

interface DashboardStatCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  footer: ReactNode;
  sparklinePoints: readonly number[];
  iconClassName: string;
  sparklineClassName: string;
  href?: string;
  className?: string;
}

export function DashboardStatCard({
  icon: Icon,
  title,
  value,
  footer,
  sparklinePoints,
  iconClassName,
  sparklineClassName,
  href,
  className,
}: DashboardStatCardProps) {
  const content = (
    <>
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            iconClassName,
          )}
        >
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
        {value}
      </p>

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div className="min-w-0 text-sm">{footer}</div>
        <DashboardSparkline
          points={sparklinePoints}
          className={sparklineClassName}
          strokeClassName="stroke-current"
        />
      </div>
    </>
  );

  const cardClassName = cn(
    "surface-card relative flex min-h-[10.5rem] flex-col p-5",
    href && "transition-colors hover:bg-accent/30",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName}>
        {content}
        <ChevronRight
          className="absolute top-5 right-4 size-4 text-muted-foreground"
          aria-hidden
        />
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
