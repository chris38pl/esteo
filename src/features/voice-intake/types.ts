import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";

export type VoiceIntakePhase =
  | "idle"
  | "recording_initial"
  | "recording_follow_up"
  | "analyzing"
  | "analyzing_follow_up"
  | "follow_up_success"
  | "review"
  | "applying"
  | "error";

export type VoiceApplyPhase = "idle" | "checklist_reveal" | "filling" | "done";

export type VoiceIntakeErrorCode =
  | "mic_denied"
  | "recording_too_short"
  | "recording_too_long"
  | "empty_audio"
  | "audio_too_large"
  | "rate_limited"
  | "transcription_failed"
  | "extraction_failed"
  | "captcha_failed"
  | "unauthorized"
  | "entitlement_exceeded"
  | "unavailable"
  | "invalid";

export type VoiceIntakeApiResponse = {
  transcript: string;
  followUpTranscript?: string;
  combinedTranscript: string;
  cleanedTranscript: string;
  displayTitle: string;
  extraction: VoiceIntakeExtraction;
  overallConfidence: number;
};

export type VoiceIntakeMetadata = {
  version: 2;
  transcript: string;
  followUpTranscript?: string;
  combinedTranscript: string;
  cleanedTranscript: string;
  displayTitle: string | null;
  projectSummary: string | null;
  generatedTitle: string | null;
  overallConfidence: number;
  fieldConfidences: Record<string, number>;
  audioDurationMs?: number;
  followUpDurationMs?: number;
  usedFollowUp: boolean;
  models: {
    whisper: string;
    extraction: string;
  };
};

export type MissingFieldInfo = {
  fieldKey: string;
  label: string;
  reason: "empty" | "low_confidence" | "ambiguous";
  priority: "key" | "contact" | "optional";
};
