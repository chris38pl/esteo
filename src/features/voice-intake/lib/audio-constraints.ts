export const VOICE_INTAKE_MAX_INITIAL_MS = 180_000;
export const VOICE_INTAKE_MAX_FOLLOW_UP_MS = 60_000;
export const VOICE_INTAKE_MIN_RECORDING_MS = 3_000;
export const VOICE_INTAKE_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const VOICE_INTAKE_MAX_FOLLOW_UP_UPLOAD_BYTES = 5 * 1024 * 1024;

export const VOICE_INTAKE_ACCEPTED_MIME_TYPES = [
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
] as const;

export function getPreferredRecordingMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "audio/webm";
  }

  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];

  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }

  return "audio/webm";
}
