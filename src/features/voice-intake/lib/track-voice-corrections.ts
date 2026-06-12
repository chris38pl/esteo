import {
  trackVoiceEvent,
  VoiceAnalyticsEvents,
} from "@/features/voice-intake/lib/voice-analytics";
import type { VoiceAppliedValues, VoiceTrackableField } from "@/features/voice-intake/lib/map-extraction-to-form";

export type VoiceCorrectionFinalValues = {
  city?: string;
  area?: number | string | null;
  preferredStartDate?: string;
  propertyType?: string;
};

function normalizeComparable(field: VoiceTrackableField, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (field === "area") {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) ? String(num) : "";
  }
  return String(value).trim();
}

function valuesDiffer(field: VoiceTrackableField, applied: unknown, final: unknown): boolean {
  return normalizeComparable(field, applied) !== normalizeComparable(field, final);
}

export function trackVoiceCorrectionsOnSubmit(
  voiceAppliedValues: VoiceAppliedValues | null | undefined,
  finalValues: VoiceCorrectionFinalValues,
): void {
  if (!voiceAppliedValues) return;

  const checks: [VoiceTrackableField, unknown][] = [
    ["city", finalValues.city],
    ["area", finalValues.area],
    ["preferredStartDate", finalValues.preferredStartDate],
    ["propertyType", finalValues.propertyType],
  ];

  for (const [field, finalValue] of checks) {
    const appliedValue = voiceAppliedValues[field];
    if (appliedValue === undefined) continue;
    if (valuesDiffer(field, appliedValue, finalValue)) {
      trackVoiceEvent(VoiceAnalyticsEvents.fieldCorrected, {
        field,
        aiFilled: true,
      });
    }
  }
}
