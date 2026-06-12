/** Static recorder state for admin UI preview (no microphone). */
export type VoiceRecordingPreviewState = {
  level?: number;
  durationMs?: number;
  active?: boolean;
  isRecording?: boolean;
};

export const VOICE_RECORDING_PREVIEW_DEFAULTS = {
  level: 0.55,
  durationMs: 2_400,
  active: true,
  isRecording: true,
} as const;
