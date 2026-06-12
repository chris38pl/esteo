"use client";

import { useTranslations } from "next-intl";

import { VOICE_ERROR_OWL_IMAGES } from "@/features/voice-intake/lib/recording-visual-assets";
import type { VoiceIntakeErrorCode } from "@/features/voice-intake/types";
import { Button } from "@/components/ui/button";

export function VoiceErrorStage({
  errorCode,
  onRetry,
}: {
  errorCode: VoiceIntakeErrorCode;
  onRetry: () => void;
}) {
  const t = useTranslations("voiceIntake.errors");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="relative size-44 max-w-[min(70vw,11rem)]">
          <img
            src={VOICE_ERROR_OWL_IMAGES.light}
            alt=""
            draggable={false}
            className="size-full select-none object-contain dark:hidden"
          />
          <img
            src={VOICE_ERROR_OWL_IMAGES.dark}
            alt=""
            draggable={false}
            className="hidden size-full select-none object-contain dark:block"
          />
        </div>

        <h2 className="mt-6 text-xl font-semibold tracking-tight text-foreground">{t("heading")}</h2>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(errorCode)}</p>

        <Button
          type="button"
          className="mt-8 h-12 w-full rounded-xl text-base font-medium"
          onClick={onRetry}
        >
          {t("retry")}
        </Button>
      </div>
    </div>
  );
}
