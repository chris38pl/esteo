"use client";

import { Shield } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { VoiceRecordingStopButton } from "@/features/voice-intake/components/voice-recording-stop-button";
import { VoiceRecordingVisualizer } from "@/features/voice-intake/components/voice-recording-visualizer";
import { useMediaRecorder } from "@/features/voice-intake/hooks/use-media-recorder";
import {
  VOICE_INTAKE_MAX_INITIAL_MS,
  VOICE_INTAKE_MIN_RECORDING_MS,
} from "@/features/voice-intake/lib/audio-constraints";
import {
  VOICE_RECORDING_PREVIEW_DEFAULTS,
  type VoiceRecordingPreviewState,
} from "@/features/voice-intake/lib/voice-recording-preview";
import type { VoiceIntakeErrorCode } from "@/features/voice-intake/types";

export function VoiceInitialRecordingStage({
  onComplete,
  onError,
  preview,
}: {
  onComplete: (blob: Blob, durationMs: number) => void;
  onError: (code: VoiceIntakeErrorCode) => void;
  preview?: VoiceRecordingPreviewState;
}) {
  const t = useTranslations("voiceIntake.recording");
  const isPreview = preview !== undefined;

  const recorder = useMediaRecorder({
    maxDurationMs: VOICE_INTAKE_MAX_INITIAL_MS,
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

  const warningThreshold = 150_000;

  return (
    <div className="w-full max-w-[26rem] shrink-0 rounded-[1.75rem] border border-border/50 bg-card/95 px-6 py-7 shadow-2xl shadow-black/10 backdrop-blur-md dark:bg-card/90 dark:shadow-black/40">
      <div className="text-center">
        <h2 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
          {t("initialTitleLine1")}
          <br />
          <span className="text-primary">{t("initialTitleHighlight")}</span>
        </h2>
        <p className="mt-[21px] text-sm leading-relaxed text-muted-foreground">{t("initialSubtitle")}</p>
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
        <p className="mt-9 text-center text-sm text-muted-foreground">{t("maxDuration")}</p>
      </div>

      <p className="mt-6 text-center text-sm leading-relaxed text-foreground">{t("speakFreely")}</p>

      <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Shield className="size-3.5 shrink-0" aria-hidden />
        <p>{t("privacy")}</p>
      </div>
    </div>
  );
}
