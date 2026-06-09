"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { retryEstimateGenerationAction } from "@/features/estimates/server/actions";
import type { Locale } from "@/lib/locale";

interface EstimateAiDraftRecoveryBannerProps {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  variant?: "failed" | "missing";
}

export function EstimateAiDraftRecoveryBanner({
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
  variant = "missing",
}: EstimateAiDraftRecoveryBannerProps) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRetry() {
    setError(null);
    startTransition(async () => {
      const result = await retryEstimateGenerationAction({
        estimateId,
        workspaceId,
        workspaceSlug,
        locale,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  const isFailed = variant === "failed";

  return (
    <div
      className={
        isFailed
          ? "mx-4 mb-4 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-8 text-center"
          : "mx-4 mb-4 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center"
      }
    >
      <p
        className={
          isFailed
            ? "text-destructive text-sm font-medium"
            : "text-sm font-medium text-foreground"
        }
      >
        {isFailed ? t("editor.generatingFailed") : t("editor.aiDraftMissing")}
      </p>
      <p className="text-muted-foreground text-xs">
        {isFailed ? t("editor.generatingFailedHint") : t("editor.aiDraftMissingHint")}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={handleRetry} disabled={isPending}>
        {isPending ? t("editor.retryGenerationPending") : t("editor.retryGeneration")}
      </Button>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
