"use client";

import { Shield } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

import { VoiceRecordingStopButton } from "@/features/voice-intake/components/voice-recording-stop-button";
import { VoiceRecordingVisualizer } from "@/features/voice-intake/components/voice-recording-visualizer";
import { useMediaRecorder } from "@/features/voice-intake/hooks/use-media-recorder";
import {
  VOICE_INTAKE_MAX_FOLLOW_UP_MS,
  VOICE_INTAKE_MIN_RECORDING_MS,
} from "@/features/voice-intake/lib/audio-constraints";
import {
  VOICE_RECORDING_PREVIEW_DEFAULTS,
  type VoiceRecordingPreviewState,
} from "@/features/voice-intake/lib/voice-recording-preview";
import type { MissingFieldInfo, VoiceIntakeErrorCode } from "@/features/voice-intake/types";

export function VoiceFollowUpRecordingStage({
  missingFields,
  onComplete,
  onError,
  preview,
}: {
  missingFields: MissingFieldInfo[];
  onComplete: (blob: Blob, durationMs: number) => void;
  onError: (code: VoiceIntakeErrorCode) => void;
  preview?: VoiceRecordingPreviewState;
}) {
  const t = useTranslations("voiceIntake.recording");
  const isPreview = preview !== undefined;

  const recorder = useMediaRecorder({
    maxDurationMs: VOICE_INTAKE_MAX_FOLLOW_UP_MS,
    onAutoStop: (blob, durationMs) => {
      if (durationMs < VOICE_INTAKE_MIN_RECORDING_MS) {
        onError("recording_too_short");
        return;
      }
      onComplete(blob, durationMs);
    },
  });

  useEffect(() => {
    if (isPreview) return;
    void recorder.startRecording();
    return () => {
      void recorder.stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreview]);

  useEffect(() => {
    if (isPreview) return;
    if (recorder.error === "mic_denied") {
      onError("mic_denied");
    }
  }, [isPreview, recorder.error, onError]);

  async function handleStop() {
    if (isPreview) return;

    const result = await recorder.stopRecording();
    if (!result) return;

    if (result.durationMs < VOICE_INTAKE_MIN_RECORDING_MS) {
      onError("recording_too_short");
      return;
    }

    onComplete(result.blob, result.durationMs);
  }

  const previewState = { ...VOICE_RECORDING_PREVIEW_DEFAULTS, ...preview };
  const level = isPreview ? (previewState.level ?? 0) : recorder.audioLevel;
  const active = isPreview ? (previewState.active ?? true) : recorder.isRecording;
  const durationMs = isPreview ? (previewState.durationMs ?? 0) : recorder.durationMs;

  const warningThreshold = 45_000;

  const missingLabels = useMemo(
    () =>
      missingFields
        .filter((item) => item.priority === "key" || item.priority === "contact")
        .map((item) => item.label),
    [missingFields],
  );

  return (
    <div className="w-full max-w-[26rem] shrink-0 rounded-[1.75rem] border border-border/50 bg-card/95 px-5 py-5 shadow-2xl shadow-black/10 backdrop-blur-md sm:px-6 sm:py-7 dark:bg-card/90 dark:shadow-black/40">
      <div className="text-center">
        <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
          {t("followUpTitleLine1")}
          <br />
          <span className="text-primary">{t("followUpTitleHighlight")}</span>
        </h2>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground sm:mt-[21px] sm:text-sm">
          {t("followUpMissingSubtitle")}
        </p>
      </div>

      <VoiceRecordingVisualizer
        className="mt-6"
        level={level}
        active={active}
        durationMs={durationMs}
        warningThreshold={warningThreshold}
      />

      <div className="relative z-10 -mt-5 flex flex-col items-center">
        <VoiceRecordingStopButton onClick={() => void handleStop()} />
        <p className="mt-9 text-center text-sm text-muted-foreground">{t("maxDurationFollowUp")}</p>
      </div>

      {missingLabels.length > 0 ? (
        <p className="mt-6 text-center text-xs leading-relaxed text-foreground sm:text-sm">
          {t("followUpRecordingMissingIntro")}{" "}
          <span className="text-muted-foreground">{missingLabels.join(", ")}</span>
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground sm:text-sm">
        <Shield className="size-3 shrink-0 sm:size-3.5" aria-hidden />
        <p>{t("privacy")}</p>
      </div>
    </div>
  );
}
