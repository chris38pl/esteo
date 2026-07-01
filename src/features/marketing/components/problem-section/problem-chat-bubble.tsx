import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function ProblemChatBubble({
  icon: Icon,
  line1,
  line2,
  showTail = true,
  className,
}: {
  icon: LucideIcon;
  line1: string;
  line2: string;
  showTail?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <div
        className={cn(
          "relative z-10 flex h-[3.375rem] w-[11.125rem] items-center gap-2.5 rounded-2xl border border-border/60 bg-card pl-3.5 pr-2",
        )}
      >
        <Icon className="size-[1.125rem] shrink-0 self-center text-red-400" strokeWidth={1.75} aria-hidden />
        <p className="min-w-0 flex-1 text-[10px] font-medium leading-[1.35] text-foreground">
          <span className="block">{line1}</span>
          <span className="block">{line2}</span>
        </p>
      </div>

      {showTail ? (
        <svg
          aria-hidden
          className="pointer-events-none absolute bottom-1.5 left-[calc(100%-1px)] z-0"
          width="14"
          height="17"
          viewBox="0 0 12 14"
          fill="none"
        >
          <path d="M0.5 1.25L0.5 10.25L11 12.75Z" className="fill-card" />
          <path
            d="M0.5 1.25L11 12.75M0.5 10.25L11 12.75"
            className="stroke-border/60"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </div>
  );
}
