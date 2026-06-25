"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TemplateGeneratingSkeletonState =
  | "generating"
  | "error"
  | "prompt-missing";

interface TemplateGeneratingSkeletonProps {
  state: TemplateGeneratingSkeletonState;
  errorMessage?: string | null;
  isRetryPending?: boolean;
  onRetry?: () => void;
  onBackToGenerate?: () => void;
}

export function TemplateGeneratingSkeleton({
  state,
  errorMessage,
  isRetryPending = false,
  onRetry,
  onBackToGenerate,
}: TemplateGeneratingSkeletonProps) {
  const t = useTranslations("workspaces.configuration.templates.ai");

  if (state === "prompt-missing") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/80 p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("promptMissing")}</p>
        {onBackToGenerate ? (
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onBackToGenerate}>
            <ArrowLeft className="size-4" />
            {t("backToGenerate")}
          </Button>
        ) : null}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-12 text-center">
        <p className="text-sm font-medium text-destructive">
          {errorMessage ?? t("generationError")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <Button type="button" size="sm" onClick={onRetry} disabled={isRetryPending}>
              {isRetryPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("retryPending")}
                </>
              ) : (
                t("retry")
              )}
            </Button>
          ) : null}
          {onBackToGenerate ? (
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onBackToGenerate}>
              <ArrowLeft className="size-4" />
              {t("backToGenerate")}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="relative flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-primary" />
        </span>
        {t("generating")}
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div
            className={cn(
              "h-5 w-32 animate-pulse rounded bg-foreground/10 dark:bg-muted",
              i === 2 && "w-40",
            )}
          />
          {[1, 2, 3].map((j) => (
            <div
              key={j}
              className={cn(
                "h-9 animate-pulse rounded bg-foreground/10 dark:bg-muted/60",
                j === 1 && "w-full",
                j === 2 && "w-11/12",
                j === 3 && "w-10/12",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
