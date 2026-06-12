import {
  VOICE_INTAKE_MAX_FOLLOW_UP_MS,
  VOICE_INTAKE_MAX_FOLLOW_UP_UPLOAD_BYTES,
  VOICE_INTAKE_MAX_INITIAL_MS,
  VOICE_INTAKE_MAX_UPLOAD_BYTES,
  VOICE_INTAKE_MIN_RECORDING_MS,
} from "@/features/voice-intake/lib/audio-constraints";

export function validateVoiceAudio(input: {
  buffer: Buffer;
  durationMs: number;
  isFollowUp: boolean;
}): { ok: true } | { ok: false; code: string } {
  const maxBytes = input.isFollowUp
    ? VOICE_INTAKE_MAX_FOLLOW_UP_UPLOAD_BYTES
    : VOICE_INTAKE_MAX_UPLOAD_BYTES;
  const maxDuration = input.isFollowUp ? VOICE_INTAKE_MAX_FOLLOW_UP_MS : VOICE_INTAKE_MAX_INITIAL_MS;

  if (input.buffer.length > maxBytes) {
    return { ok: false, code: "audio_too_large" };
  }

  if (input.durationMs < VOICE_INTAKE_MIN_RECORDING_MS) {
    return { ok: false, code: "recording_too_short" };
  }

  if (input.durationMs > maxDuration) {
    return { ok: false, code: "recording_too_long" };
  }

  return { ok: true };
}
