import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";

type ConfidenceFieldKey =
  | "description"
  | "propertyType"
  | "address"
  | "city"
  | "postalCode"
  | "voivodeship"
  | "area"
  | "preferredStartDate"
  | "fullName"
  | "email"
  | "phone";

const CONFIDENCE_FIELD_KEYS: ConfidenceFieldKey[] = [
  "description",
  "propertyType",
  "address",
  "city",
  "postalCode",
  "voivodeship",
  "area",
  "preferredStartDate",
  "fullName",
  "email",
  "phone",
];

function assignConfidenceField<K extends ConfidenceFieldKey>(
  target: VoiceIntakeExtraction,
  key: K,
  value: VoiceIntakeExtraction[K],
): void {
  target[key] = value;
}

function isExplicitContradiction(
  fieldKey: ConfidenceFieldKey,
  previous: VoiceIntakeExtraction,
  followUpTranscript: string,
): boolean {
  const prevValue = previous[fieldKey].value;
  if (prevValue === null) return false;

  const normalizedTranscript = followUpTranscript.toLowerCase();
  const normalizedValue = String(prevValue).toLowerCase();

  if (fieldKey === "city" && normalizedTranscript.includes(normalizedValue)) {
    return false;
  }

  return false;
}

export function stabilizeVoiceIntakeMerge(input: {
  previous: VoiceIntakeExtraction;
  next: VoiceIntakeExtraction;
  missingFieldKeys: string[];
  followUpTranscript?: string;
}): VoiceIntakeExtraction {
  const result: VoiceIntakeExtraction = structuredClone(input.previous);

  for (const key of CONFIDENCE_FIELD_KEYS) {
    const prev = input.previous[key];
    const nxt = input.next[key];
    const wasMissing = input.missingFieldKeys.includes(key);
    const contradicted =
      input.followUpTranscript &&
      isExplicitContradiction(key, input.previous, input.followUpTranscript);

    if (wasMissing && nxt.confidence >= 0.5 && nxt.value !== null) {
      assignConfidenceField(result, key, nxt);
      continue;
    }

    if (!wasMissing && !contradicted) {
      if (prev.confidence >= 0.5 && prev.value !== null) {
        assignConfidenceField(result, key, prev);
        continue;
      }
    }

    if (
      prev.confidence >= 0.85 &&
      nxt.confidence < prev.confidence &&
      prev.value !== null &&
      !wasMissing &&
      !contradicted
    ) {
      assignConfidenceField(result, key, prev);
      continue;
    }

    if (nxt.confidence > prev.confidence && nxt.value !== null) {
      assignConfidenceField(result, key, nxt);
    }
  }

  if (input.missingFieldKeys.includes("scopeOfWork") && input.next.scopeOfWork.items.length > 0) {
    result.scopeOfWork = input.next.scopeOfWork;
  } else if (
    input.previous.scopeOfWork.confidence >= 0.5 &&
    input.previous.scopeOfWork.items.length > 0
  ) {
    result.scopeOfWork = input.previous.scopeOfWork;
  }

  if (
    input.previous.projectSummary.confidence >= 0.85 &&
    input.next.projectSummary.confidence < input.previous.projectSummary.confidence &&
    input.next.projectSummary.value === null
  ) {
    result.projectSummary = input.previous.projectSummary;
  } else if (input.next.projectSummary.confidence >= input.previous.projectSummary.confidence) {
    result.projectSummary = input.next.projectSummary;
  }

  if (
    input.next.generatedTitle.confidence >= input.previous.generatedTitle.confidence &&
    input.next.generatedTitle.value
  ) {
    result.generatedTitle = input.next.generatedTitle;
  }

  return result;
}
