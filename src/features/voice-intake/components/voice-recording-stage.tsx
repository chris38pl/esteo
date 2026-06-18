"use client";

import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";
import { VoiceFollowUpRecordingStage } from "@/features/voice-intake/components/voice-follow-up-recording-stage";
import { VoiceInitialRecordingStage } from "@/features/voice-intake/components/voice-initial-recording-stage";
import type { VoiceRecordingPreviewState } from "@/features/voice-intake/lib/voice-recording-preview";
import type { MissingFieldInfo, VoiceIntakeErrorCode } from "@/features/voice-intake/types";
import type { Locale } from "@/lib/locale";
import type { WorkspaceIndustry } from "@prisma/client";

export function VoiceRecordingStage({
  mode,
  missingFields,
  onComplete,
  onError,
  preview,
  industry,
}: {
  mode: "initial" | "follow_up";
  extraction?: VoiceIntakeExtraction | null;
  cleanedTranscript?: string;
  locale?: Locale;
  missingFields?: MissingFieldInfo[];
  onComplete: (blob: Blob, durationMs: number) => void;
  onCancel?: () => void;
  onError: (code: VoiceIntakeErrorCode) => void;
  preview?: VoiceRecordingPreviewState;
  industry: WorkspaceIndustry;
}) {
  if (mode === "follow_up") {
    return (
      <VoiceFollowUpRecordingStage
        missingFields={missingFields ?? []}
        industry={industry}
        onComplete={onComplete}
        onError={onError}
        preview={preview}
      />
    );
  }

  return (
    <VoiceInitialRecordingStage
      onComplete={onComplete}
      onError={onError}
      preview={preview}
      industry={industry}
    />
  );
}
