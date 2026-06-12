"use client";

import { useTranslations } from "next-intl";

import type { ConfidenceSummary } from "@/features/voice-intake/lib/build-confidence-summary";
import { cn } from "@/lib/utils";

export function VoiceConfidenceSummary({ summary }: { summary: ConfidenceSummary }) {
  const t = useTranslations("voiceIntake.confidence");

  const primaryMessage =
    summary.tier === "high"
      ? t("high")
      : summary.tier === "medium"
        ? t("recognized", {
            recognized: summary.recognizedCount,
            total: summary.totalKeyFields,
          })
        : t("low");

  return (
    <div
      className={cn(
        "rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 text-xs",
        summary.tier === "low" && "border-amber-500/20 bg-amber-500/5",
      )}
    >
      <p className="text-muted-foreground">{primaryMessage}</p>
      {summary.tier !== "low" ? (
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          {t("percent", { percent: summary.overallPercent })}
        </p>
      ) : null}
    </div>
  );
}
