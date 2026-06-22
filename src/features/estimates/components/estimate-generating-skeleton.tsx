"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { retryEstimateGenerationAction } from "@/features/estimates/server/actions";
import { useGenerationPolling } from "@/features/estimates/hooks/use-generation-polling";
import type { Locale } from "@/lib/locale";

interface EstimateGeneratingSkeletonProps {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  initialStatus?: string | null;
  initialCanManualRetry?: boolean;
}

export function EstimateGeneratingSkeleton({
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
  initialStatus,
  initialCanManualRetry = false,
}: EstimateGeneratingSkeletonProps) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [retryError, setRetryError] = useState<string | null>(null);

  const { status, showRetry } = useGenerationPolling({
    estimateId,
    initialStatus: (initialStatus ?? "PENDING") as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
    initialCanManualRetry,
    locale,
    onFinished: (finalStatus) => {
      if (finalStatus === "COMPLETED") {
        router.refresh();
      }
    },
  });

  function handleRetry() {
    setRetryError(null);
    startTransition(async () => {
      const result = await retryEstimateGenerationAction({
        estimateId,
        workspaceId,
        workspaceSlug,
        locale,
      });

      if (!result.success) {
        setRetryError(result.error);
        return;
      }

      router.refresh();
    });
  }

  if (showRetry) {
    const isFailed = status === "FAILED";

    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center",
          isFailed && "border-destructive/50 bg-destructive/5",
        )}
      >
        <p
          className={cn(
            "text-sm",
            isFailed ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          {isFailed ? t("editor.generatingFailed") : t("editor.generatingTimeout")}
        </p>
        {!isFailed ? (
          <p className="text-muted-foreground text-xs">{t("editor.generatingStaleHint")}</p>
        ) : (
          <p className="text-muted-foreground text-xs">{t("editor.generatingFailedHint")}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant={isFailed ? "outline" : "default"} size="sm" onClick={handleRetry} disabled={isPending}>
            {isPending ? t("editor.retryGenerationPending") : t("editor.retryGeneration")}
          </Button>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {t("editor.refreshStatus")}
          </button>
        </div>
        {retryError ? <p className="text-destructive text-xs">{retryError}</p> : null}
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
        {t("editor.generating")}
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className={cn("h-5 w-32 animate-pulse rounded bg-foreground/10 dark:bg-muted", i === 2 && "w-40")} />
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
