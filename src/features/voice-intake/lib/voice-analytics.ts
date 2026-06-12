type VoiceAnalyticsPayload = Record<string, string | number | boolean | string[] | undefined>;

export function trackVoiceEvent(event: string, payload?: VoiceAnalyticsPayload) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("esteo:voice-analytics", {
      detail: { event, ...payload },
    }),
  );

  if (process.env.NODE_ENV === "development") {
    console.info("[voice-analytics]", event, payload);
  }
}

export const VoiceAnalyticsEvents = {
  started: "voice_started",
  completed: "voice_completed",
  abandoned: "voice_abandoned",
  apply: "voice_apply",
  followUpStarted: "voice_followup_started",
  followUpCompleted: "voice_followup_completed",
  followUpApplied: "voice_followup_applied",
  reRecorded: "voice_re_recorded",
  fieldCorrected: "voice_field_corrected",
} as const;
