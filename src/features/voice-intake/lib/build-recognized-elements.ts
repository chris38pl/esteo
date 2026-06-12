import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";
import { extractTranscriptScopeKeywords } from "@/features/voice-intake/lib/extract-transcript-scope-keywords";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import {
  getStartDateLabel,
  START_DATE_KEYS,
  type StartDateKey,
} from "@/features/estimate-requests/config/start-dates";
import { normalizeScopeLabel } from "@/ai/lib/voice-intake-scope-terms";
import type { Locale } from "@/lib/locale";

export const RECOGNIZED_CHECKLIST_VISIBLE_MAX = 12;

export type RecognizedElement = {
  label: string;
};

function fieldReady<T>(confidence: number, value: T | null | undefined): value is T {
  return value !== null && value !== undefined && value !== "" && confidence >= 0.5;
}

function dedupeLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const label of labels) {
    const key = normalizeScopeLabel(label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(label);
  }

  return result;
}

function fromExtraction(extraction: VoiceIntakeExtraction, locale: Locale): string[] {
  const labels: string[] = [];

  const hasProperty = fieldReady(extraction.propertyType.confidence, extraction.propertyType.value);
  const hasArea = fieldReady(extraction.area.confidence, extraction.area.value);

  if (hasProperty && hasArea) {
    const propertyValue = extraction.propertyType.value!;
    const propertyLabel = getIndustryOptionLabel("property_type", propertyValue, locale, "label");
    labels.push(`${propertyLabel} ${extraction.area.value} m²`);
  } else if (hasProperty) {
    labels.push(
      getIndustryOptionLabel(
        "property_type",
        extraction.propertyType.value!,
        locale,
        "label",
      ),
    );
  } else if (hasArea) {
    labels.push(`${extraction.area.value} m²`);
  }

  if (fieldReady(extraction.city.confidence, extraction.city.value)) {
    labels.push(extraction.city.value);
  }

  if (fieldReady(extraction.preferredStartDate.confidence, extraction.preferredStartDate.value)) {
    const dateKey = extraction.preferredStartDate.value;
    if (START_DATE_KEYS.includes(dateKey as StartDateKey)) {
      labels.push(getStartDateLabel(dateKey as StartDateKey, locale));
    } else {
      labels.push(String(dateKey));
    }
  }

  if (extraction.scopeOfWork.confidence >= 0.5) {
    for (const item of extraction.scopeOfWork.items) {
      if (item.confidence >= 0.5 && item.label.trim()) {
        const formatted =
          item.label.charAt(0).toUpperCase() + item.label.slice(1);
        labels.push(formatted);
      }
    }
  }

  if (fieldReady(extraction.fullName.confidence, extraction.fullName.value)) {
    labels.push(extraction.fullName.value);
  }
  if (fieldReady(extraction.phone.confidence, extraction.phone.value)) {
    labels.push(extraction.phone.value);
  }
  if (fieldReady(extraction.email.confidence, extraction.email.value)) {
    labels.push(extraction.email.value);
  }

  return labels;
}

export function buildRecognizedElements(
  extraction: VoiceIntakeExtraction,
  cleanedTranscript: string,
  locale: Locale,
): RecognizedElement[] {
  const merged = dedupeLabels([
    ...fromExtraction(extraction, locale),
    ...extractTranscriptScopeKeywords(cleanedTranscript),
  ]);

  return merged.map((label) => ({ label }));
}

export function capRecognizedElements(
  elements: RecognizedElement[],
  maxVisible = RECOGNIZED_CHECKLIST_VISIBLE_MAX,
): { visible: RecognizedElement[]; overflowCount: number } {
  if (elements.length <= maxVisible) {
    return { visible: elements, overflowCount: 0 };
  }

  return {
    visible: elements.slice(0, maxVisible),
    overflowCount: elements.length - maxVisible,
  };
}
