import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";

import type { MissingFieldInfo } from "@/features/voice-intake/types";
import type { Locale } from "@/lib/locale";

const FIELD_LABELS: Record<string, { pl: string; en: string }> = {
  propertyType: { pl: "typ nieruchomości", en: "property type" },
  city: { pl: "miasto", en: "city" },
  area: { pl: "powierzchnia", en: "area" },
  preferredStartDate: { pl: "termin realizacji", en: "start date" },
  scopeOfWork: { pl: "zakres prac", en: "scope of work" },
  address: { pl: "adres", en: "street address" },
  postalCode: { pl: "kod pocztowy", en: "postal code" },
  voivodeship: { pl: "województwo", en: "voivodeship" },
  description: { pl: "opis projektu", en: "project description" },
  contact: { pl: "dane kontaktowe", en: "contact details" },
};

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

function labelFor(fieldKey: string, locale: Locale): string {
  return FIELD_LABELS[fieldKey]?.[locale] ?? fieldKey;
}

function isFieldMissing(
  extraction: VoiceIntakeExtraction,
  key: ConfidenceFieldKey,
  ambiguities: Set<string>,
): "empty" | "low_confidence" | "ambiguous" | null {
  if (ambiguities.has(key)) {
    return "ambiguous";
  }

  const field = extraction[key];
  if (field.value === null || field.value === "") {
    return "empty";
  }

  if (field.confidence < 0.5) {
    return "low_confidence";
  }

  return null;
}

function hasContactInfo(extraction: VoiceIntakeExtraction): boolean {
  const fields = [extraction.fullName, extraction.email, extraction.phone];
  return fields.some((f) => f.value !== null && f.value !== "" && f.confidence >= 0.5);
}

export function detectMissingFields(
  extraction: VoiceIntakeExtraction,
  locale: Locale,
): MissingFieldInfo[] {
  const ambiguities = new Set(extraction.ambiguities.map((a) => a.field));
  const missing: MissingFieldInfo[] = [];

  const keyFields: ConfidenceFieldKey[] = [
    "propertyType",
    "city",
    "area",
    "preferredStartDate",
  ];

  for (const key of keyFields) {
    const reason = isFieldMissing(extraction, key, ambiguities);
    if (reason) {
      missing.push({
        fieldKey: key,
        label: labelFor(key, locale),
        reason,
        priority: "key",
      });
    }
  }

  if (
    extraction.scopeOfWork.items.length === 0 ||
    extraction.scopeOfWork.confidence < 0.5
  ) {
    missing.push({
      fieldKey: "scopeOfWork",
      label: labelFor("scopeOfWork", locale),
      reason:
        ambiguities.has("scopeOfWork")
          ? "ambiguous"
          : extraction.scopeOfWork.items.length === 0
            ? "empty"
            : "low_confidence",
      priority: "key",
    });
  }

  if (!hasContactInfo(extraction)) {
    missing.push({
      fieldKey: "contact",
      label: labelFor("contact", locale),
      reason: "empty",
      priority: "contact",
    });
  }

  const optionalFields: ConfidenceFieldKey[] = [
    "address",
    "postalCode",
    "voivodeship",
    "description",
  ];

  for (const key of optionalFields) {
    const reason = isFieldMissing(extraction, key, ambiguities);
    if (reason) {
      missing.push({
        fieldKey: key,
        label: labelFor(key, locale),
        reason,
        priority: "optional",
      });
    }
  }

  return missing;
}

export function canShowFollowUpCta(): boolean {
  return true;
}
