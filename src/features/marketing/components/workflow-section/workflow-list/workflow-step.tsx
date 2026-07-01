"use client";

import { motion } from "framer-motion";

import type { WorkflowStep as WorkflowStepData } from "@/features/marketing/components/workflow-section/workflow-data";
import { cn } from "@/lib/utils";

export function WorkflowStep({
  step,
  index,
  isActive,
  onSelect,
  onKeyDown,
  mobile = false,
}: {
  step: WorkflowStepData;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  mobile?: boolean;
}) {
  return (
    <motion.button
      type="button"
      role="tab"
      id={`workflow-step-${index}`}
      aria-selected={isActive}
      aria-controls={`workflow-panel-${index}`}
      tabIndex={isActive ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      whileHover={isActive ? undefined : { x: 2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative w-full rounded-xl border text-left transition-colors duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        mobile ? "min-h-[5.25rem] px-4 py-4" : "min-h-[5.5rem] px-5 py-5",
        isActive
          ? "border-primary/35 bg-primary/[0.06] shadow-[0_0_28px_-14px_rgba(59,130,246,0.55)]"
          : "border-border/40 bg-card/20 hover:border-border/70 hover:bg-card/35",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute bottom-3 left-0 top-3 w-0.5 rounded-full transition-all duration-300",
          isActive
            ? "bg-primary shadow-[0_0_12px_2px_rgba(59,130,246,0.65)]"
            : "bg-transparent group-hover:bg-border/80",
        )}
      />

      <div className="flex items-start gap-3 pl-2">
        <span
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground group-hover:text-foreground",
          )}
        >
          {index + 1}
        </span>
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-[0.9375rem]">
            {step.title}
          </h3>
          <p
            className={cn(
              "text-xs leading-6 transition-colors duration-300",
              isActive ? "text-muted-foreground" : "text-muted-foreground/80",
            )}
          >
            {step.description}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
