"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

import { VoiceAnalyzingStage } from "@/features/voice-intake/components/voice-analyzing-stage";
import { VoiceErrorStage } from "@/features/voice-intake/components/voice-error-stage";
import { VoiceRecordingStage } from "@/features/voice-intake/components/voice-recording-stage";
import { VoiceSummaryStage } from "@/features/voice-intake/components/voice-summary-stage";
import type { useVoiceIntake } from "@/features/voice-intake/hooks/use-voice-intake";
import type { Locale } from "@/lib/locale";
import { Button } from "@/components/ui/button";

type VoiceIntakeState = ReturnType<typeof useVoiceIntake>;

export function VoiceExperiencePortal({
  voice,
  locale,
  onApply,
}: {
  voice: VoiceIntakeState;
  locale: Locale;
  onApply: () => void;
}) {
  const t = useTranslations("voiceIntake");

  useEffect(() => {
    if (!voice.open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [voice.open]);

  if (!voice.open || typeof document === "undefined") {
    return null;
  }

  function handleClose() {
    if (voice.phase === "recording_initial" || voice.phase === "recording_follow_up") {
      const confirmed = window.confirm(t("recording.cancel"));
      if (!confirmed) return;
    }

    voice.closePortal();
  }

  function handleApply() {
    voice.markApplying();
    onApply();
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("portal.ariaLabel")}
      className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-xl"
      style={{ height: "100dvh" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)]" />

      <div className="relative z-10 flex items-center justify-end px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={handleClose}
          aria-label={t("portal.close")}
        >
          <X className="size-5" />
        </Button>
      </div>

      <div
        className={
          voice.phase === "recording_initial" || voice.phase === "recording_follow_up"
            ? "relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 pb-8"
            : "relative z-10 flex min-h-0 flex-1 flex-col"
        }
      >
        {voice.phase === "recording_initial" ? (
          <VoiceRecordingStage
            key="initial"
            mode="initial"
            extraction={null}
            cleanedTranscript=""
            locale={locale}
            missingFields={voice.missingFields}
            onComplete={(blob, durationMs) => void voice.submitAudio(blob, durationMs, false)}
            onCancel={handleClose}
            onError={(code) => {
              voice.setError(code);
              voice.setPhase("error");
            }}
          />
        ) : null}

        {voice.phase === "recording_follow_up" ? (
          <VoiceRecordingStage
            key="follow-up"
            mode="follow_up"
            locale={locale}
            missingFields={voice.missingFields}
            onComplete={(blob, durationMs) => void voice.submitAudio(blob, durationMs, true)}
            onCancel={handleClose}
            onError={(code) => {
              if (code === "recording_too_short") {
                return;
              }
              voice.setError(code);
              voice.setPhase("error");
            }}
          />
        ) : null}

        {voice.phase === "analyzing" || voice.phase === "analyzing_follow_up" ? (
          <VoiceAnalyzingStage isFollowUp={voice.phase === "analyzing_follow_up"} />
        ) : null}

        {voice.phase === "review" &&
        voice.extraction &&
        voice.transcript &&
        voice.cleanedTranscript ? (
          <VoiceSummaryStage
            extraction={voice.extraction}
            cleanedTranscript={voice.cleanedTranscript}
            locale={locale}
            missingFields={voice.missingFields}
            followUpResolvedItems={voice.followUpResolvedItems}
            followUpNoNewInfo={voice.followUpNoNewInfo}
            onStartFollowUp={voice.startFollowUpRecording}
            onApply={handleApply}
            onReRecord={voice.reRecordFromScratch}
          />
        ) : null}

        {voice.phase === "error" && voice.error ? (
          <VoiceErrorStage errorCode={voice.error} onRetry={voice.retryFromError} />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
