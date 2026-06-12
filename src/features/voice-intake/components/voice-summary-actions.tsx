"use client";

import { ArrowRight, Mic, RotateCcw, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

const secondaryActionClassName =
  "h-11 rounded-xl border-border/60 bg-background/60 text-xs shadow-none dark:border-input/60 dark:bg-input/25 sm:text-sm";

export function VoiceSummaryActions({
  onApply,
  onFollowUpPress,
  onReRecord,
}: {
  onApply: () => void;
  onFollowUpPress: () => void;
  onReRecord: () => void;
}) {
  const tReview = useTranslations("voiceIntake.review");

  return (
    <div className="flex w-full flex-col gap-2.5">
      <Button
        type="button"
        className="h-12 w-full rounded-xl text-base font-medium"
        onClick={onApply}
      >
        {tReview("apply")}
        <ArrowRight className="size-4" />
      </Button>

      <div className="grid w-full grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className={secondaryActionClassName}
          onClick={onFollowUpPress}
        >
          <Mic className="size-3.5" />
          <span className="truncate">{tReview("followUp")}</span>
        </Button>

        <Button type="button" variant="outline" className={secondaryActionClassName} onClick={onReRecord}>
          <RotateCcw className="size-3.5" />
          <span className="truncate">{tReview("reRecord")}</span>
        </Button>
      </div>

      <div className="mt-4 flex justify-center px-1">
        <div className="flex max-w-[18rem] items-start gap-2">
          <Shield className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-left text-[10px] leading-4 text-muted-foreground">{tReview("privacy")}</p>
        </div>
      </div>
    </div>
  );
}
