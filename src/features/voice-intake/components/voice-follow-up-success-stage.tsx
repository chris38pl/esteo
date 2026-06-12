"use client";

import { AlertTriangle, Check } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ResolvedFieldItem } from "@/features/voice-intake/lib/diff-missing-fields";
import type { MissingFieldInfo } from "@/features/voice-intake/types";
import { Button } from "@/components/ui/button";

export function VoiceFollowUpSuccessStage({
  resolvedItems,
  stillMissing,
  noNewInfo,
  onApply,
  onContinueToReview,
  onRetryFollowUp,
  onFollowUp,
}: {
  resolvedItems: ResolvedFieldItem[];
  stillMissing: MissingFieldInfo[];
  noNewInfo: boolean;
  onApply: () => void;
  onContinueToReview: () => void;
  onRetryFollowUp: () => void;
  onFollowUp: () => void;
}) {
  const t = useTranslations("voiceIntake.followUpSuccess");

  if (noNewInfo) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-8">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{t("noNewInfoTitle")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("noNewInfo")}</p>
        </div>
        <div className="shrink-0 space-y-2.5 border-t border-border/60 bg-background/90 px-6 py-5 backdrop-blur-sm">
          <Button type="button" className="h-12 w-full rounded-xl text-base" onClick={onRetryFollowUp}>
            {t("retry")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl"
            onClick={onContinueToReview}
          >
            {t("backToReview")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-8">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{t("title")}</h2>

        {resolvedItems.length > 0 ? (
          <section className="space-y-3">
            <p className="text-sm font-medium text-foreground">{t("addedHeading")}</p>
            <ul className="space-y-2">
              {resolvedItems.map((item) => (
                <li key={item.fieldKey} className="flex items-center gap-2 text-sm text-foreground/90">
                  <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{item.displayValue}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {stillMissing.length > 0 ? (
          <section className="space-y-2 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              {t("stillMissing")}
            </p>
            <ul className="space-y-1 pl-6 text-sm text-muted-foreground">
              {stillMissing.map((item) => (
                <li key={item.fieldKey}>{item.label}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <div className="shrink-0 space-y-2.5 border-t border-border/60 bg-background/90 px-6 py-5 backdrop-blur-sm">
        <Button type="button" className="h-12 w-full rounded-xl text-base" onClick={onApply}>
          {t("apply")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-xl"
          onClick={onContinueToReview}
        >
          {t("viewSummary")}
        </Button>
        {stillMissing.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full rounded-xl text-muted-foreground"
            onClick={onFollowUp}
          >
            {t("followUp")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
