import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";

export type ConfidenceSummaryTier = "high" | "medium" | "low";

export type ConfidenceSummary = {
  recognizedCount: number;
  totalKeyFields: number;
  overallPercent: number;
  tier: ConfidenceSummaryTier;
};

const KEY_FIELD_CHECKS: ((e: VoiceIntakeExtraction) => boolean)[] = [
  (e) => e.propertyType.value !== null && e.propertyType.confidence >= 0.5,
  (e) => e.city.value !== null && e.city.confidence >= 0.5,
  (e) => e.area.value !== null && e.area.confidence >= 0.5,
  (e) => e.preferredStartDate.value !== null && e.preferredStartDate.confidence >= 0.5,
  (e) => e.scopeOfWork.items.length > 0 && e.scopeOfWork.confidence >= 0.5,
];

export function buildConfidenceSummary(extraction: VoiceIntakeExtraction): ConfidenceSummary {
  const totalKeyFields = KEY_FIELD_CHECKS.length;
  const recognizedCount = KEY_FIELD_CHECKS.filter((check) => check(extraction)).length;

  const confidences: number[] = [];
  if (extraction.propertyType.value !== null) confidences.push(extraction.propertyType.confidence);
  if (extraction.city.value !== null) confidences.push(extraction.city.confidence);
  if (extraction.area.value !== null) confidences.push(extraction.area.confidence);
  if (extraction.preferredStartDate.value !== null) {
    confidences.push(extraction.preferredStartDate.confidence);
  }
  if (extraction.scopeOfWork.items.length > 0) {
    confidences.push(extraction.scopeOfWork.confidence);
  }

  const overallPercent =
    confidences.length > 0
      ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100)
      : 0;

  let tier: ConfidenceSummaryTier = "low";
  if (recognizedCount >= 4 && overallPercent >= 85) {
    tier = "high";
  } else if (recognizedCount >= 3 || overallPercent >= 65) {
    tier = "medium";
  }

  return {
    recognizedCount,
    totalKeyFields,
    overallPercent,
    tier,
  };
}

export function computeOverallConfidence(extraction: VoiceIntakeExtraction): number {
  const summary = buildConfidenceSummary(extraction);
  return summary.overallPercent / 100;
}
