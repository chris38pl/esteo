"use client";

import { ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  APP_TOAST_VARIANTS,
  type AppToastAction,
  type AppToastVariant,
} from "./app-toast-variants";

export type AppToastProps = {
  variant: AppToastVariant;
  title: string;
  description?: string;
  primaryAction?: AppToastAction;
  secondaryAction?: AppToastAction;
  showProgress?: boolean;
  progressDurationMs?: number;
  onDismiss?: () => void;
  className?: string;
  size?: "default" | "compact";
  hideDismiss?: boolean;
};

export function AppToast({
  variant,
  title,
  description,
  primaryAction,
  secondaryAction,
  showProgress = true,
  progressDurationMs,
  onDismiss,
  className,
  size = "default",
  hideDismiss = false,
}: AppToastProps) {
  const config = APP_TOAST_VARIANTS[variant];
  const Icon = config.icon;
  const hasActions = Boolean(primaryAction || secondaryAction);
  const isCompact = size === "compact";
  const shouldShowProgress =
    showProgress && progressDurationMs != null && progressDurationMs > 0 && progressDurationMs !== Infinity;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border bg-popover text-popover-foreground shadow-lg pointer-events-auto",
        "ring-1 ring-black/5 dark:ring-white/5",
        isCompact ? "rounded-lg" : "rounded-xl",
        config.borderClassName,
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {!hideDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            "absolute z-10 inline-flex touch-manipulation items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            isCompact
              ? "right-1 top-1 min-h-7 min-w-7"
              : "right-2 top-2 min-h-11 min-w-11",
          )}
          aria-label="Close"
        >
          <X className={cn(isCompact ? "size-3" : "size-4")} aria-hidden />
        </button>
      ) : null}

      <div className={cn("flex", isCompact ? "gap-2 p-2" : "gap-3.5 p-4", hasActions && (isCompact ? "pb-2" : "pb-3.5"))}>
        <div
          className={cn(
            "shrink-0 items-center justify-center rounded-full flex",
            isCompact ? "size-6" : "mt-0.5 size-10",
            config.iconWrapClassName,
          )}
        >
          <Icon
            className={cn(
              isCompact ? "size-3" : "size-5",
              config.iconClassName,
              config.spinIcon && "animate-spin",
            )}
            aria-hidden
          />
        </div>

        <div className={cn("min-w-0 flex-1", isCompact ? "pr-1" : "pr-10")}>
          <p
            className={cn(
              "font-semibold leading-snug text-foreground",
              isCompact ? "text-[10px]" : "text-sm",
            )}
          >
            {title}
          </p>
          {description ? (
            <p
              className={cn(
                "leading-relaxed text-muted-foreground",
                isCompact ? "mt-1 text-[10px]" : "mt-1.5 text-sm",
              )}
            >
              {description}
            </p>
          ) : null}

          {hasActions ? (
            <div className={cn("flex flex-wrap items-center", isCompact ? "mt-2 gap-2" : "mt-4 gap-2.5")}>
              {primaryAction ? (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors",
                    isCompact ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
                    config.primaryButtonClassName,
                  )}
                >
                  {primaryAction.label}
                  <ChevronRight className={cn("shrink-0 opacity-90", isCompact ? "size-3" : "size-4")} aria-hidden />
                </button>
              ) : null}
              {secondaryAction ? (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className={cn(
                    "inline-flex items-center rounded-lg font-medium transition-colors",
                    isCompact ? "h-7 px-1 text-xs" : "h-9 px-1 text-sm",
                    config.secondaryActionClassName,
                  )}
                >
                  {secondaryAction.label}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {shouldShowProgress ? (
        <div
          className={cn(
            "absolute bottom-0 left-0 w-[28%] overflow-hidden rounded-full",
            isCompact ? "h-[2px]" : "h-[3px]",
          )}
        >
          <div
            className={cn("h-full w-full origin-left app-toast-progress", config.accentClassName)}
            style={{ animationDuration: `${progressDurationMs}ms` }}
          />
        </div>
      ) : null}
    </div>
  );
}
