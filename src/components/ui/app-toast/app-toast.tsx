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
}: AppToastProps) {
  const config = APP_TOAST_VARIANTS[variant];
  const Icon = config.icon;
  const hasActions = Boolean(primaryAction || secondaryAction);
  const shouldShowProgress =
    showProgress && progressDurationMs != null && progressDurationMs > 0 && progressDurationMs !== Infinity;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg",
        "ring-1 ring-black/5 dark:ring-white/5",
        config.borderClassName,
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        aria-label="Close"
      >
        <X className="size-4" aria-hidden />
      </button>

      <div className={cn("flex gap-3.5 p-4", hasActions && "pb-3.5")}>
        <div
          className={cn(
            "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full",
            config.iconWrapClassName,
          )}
        >
          <Icon
            className={cn(
              "size-5",
              config.iconClassName,
              config.spinIcon && "animate-spin",
            )}
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1 pr-6">
          <p className="text-sm font-semibold leading-snug text-foreground">{title}</p>
          {description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}

          {hasActions ? (
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {primaryAction ? (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-colors",
                    config.primaryButtonClassName,
                  )}
                >
                  {primaryAction.label}
                  <ChevronRight className="size-4 shrink-0 opacity-90" aria-hidden />
                </button>
              ) : null}
              {secondaryAction ? (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className={cn(
                    "inline-flex h-9 items-center rounded-lg px-1 text-sm font-medium transition-colors",
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
        <div className="absolute bottom-0 left-0 h-[3px] w-[28%] overflow-hidden rounded-full">
          <div
            className={cn("h-full w-full origin-left app-toast-progress", config.accentClassName)}
            style={{ animationDuration: `${progressDurationMs}ms` }}
          />
        </div>
      ) : null}
    </div>
  );
}
