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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const inertedRoots: HTMLElement[] = [];
    for (const child of document.body.children) {
      if (child instanceof HTMLElement && child.getAttribute("role") !== "dialog") {
        child.setAttribute("inert", "");
        inertedRoots.push(child);
      }
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      for (const root of inertedRoots) {
        root.removeAttribute("inert");
      }
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
      className="fixed inset-0 z-[100] isolate flex flex-col pointer-events-auto touch-none"
      style={{ height: "100dvh" }}
    >
      {/* Full-screen capture layer — blocks clicks to the page behind the portal */}
      <div
        className="absolute inset-0 z-0 bg-background/95 backdrop-blur-xl"
        aria-hidden
        onClick={(event) => event.stopPropagation()}
      />

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)]" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-30 size-10 rounded-full border border-border/45 bg-background/55 shadow-md backdrop-blur-md hover:bg-background/75"
        onClick={handleClose}
        aria-label={t("portal.close")}
      >
        <X className="size-5" />
      </Button>

      <div
        className={
          voice.phase === "recording_initial" || voice.phase === "recording_follow_up"
            ? "relative z-10 flex h-full min-h-0 w-full flex-1 touch-auto items-center justify-center overflow-y-auto px-4 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]"
            : "relative z-10 flex h-full min-h-0 w-full flex-1 touch-auto flex-col overflow-y-auto px-4 pb-8 pt-[max(3.25rem,calc(env(safe-area-inset-top)+2.75rem))]"
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
