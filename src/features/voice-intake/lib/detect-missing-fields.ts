import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";

import { getIndustryExperienceConfig } from "@/features/estimate-requests/config/industry-experience-config";
import type { MissingFieldInfo } from "@/features/voice-intake/types";
import type { WorkspaceIndustry } from "@prisma/client";
import type { Locale } from "@/lib/locale";

const FIELD_LABELS: Record<string, { pl: string; en: string }> = {
  propertyType: { pl: "typ nieruchomości", en: "property type" },
  city: { pl: "miasto", en: "city" },
  area: { pl: "powierzchnia", en: "area" },
  preferredStartDate: { pl: "termin realizacji", en: "preferred date" },
  scopeOfWork: { pl: "zakres prac", en: "scope of work" },
  address: { pl: "adres", en: "street address" },
  postalCode: { pl: "kod pocztowy", en: "postal code" },
  voivodeship: { pl: "województwo", en: "voivodeship" },
  description: { pl: "opis projektu", en: "project description" },
  productCategories: { pl: "kategorie zabudowy", en: "product categories" },
  projectType: { pl: "typ realizacji", en: "project type" },
  buildingType: { pl: "typ budynku", en: "building type" },
  projectTypes: { pl: "rodzaje prac", en: "project types" },
  budgetTier: { pl: "poziom budżetu", en: "budget tier" },
  serviceLocation: { pl: "miejsce realizacji", en: "service location" },
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

function isScopeMissing(
  extraction: VoiceIntakeExtraction,
  ambiguities: Set<string>,
): "empty" | "low_confidence" | "ambiguous" | null {
  if (ambiguities.has("scopeOfWork")) {
    return "ambiguous";
  }
  if (extraction.scopeOfWork.items.length === 0) {
    return "empty";
  }
  if (extraction.scopeOfWork.confidence < 0.5) {
    return "low_confidence";
  }
  return null;
}

function isConfiguredFieldMissing(
  fieldKey: string,
  extraction: VoiceIntakeExtraction,
  ambiguities: Set<string>,
): "empty" | "low_confidence" | "ambiguous" | null {
  if (fieldKey === "contact") {
    return hasContactInfo(extraction) ? null : "empty";
  }

  if (fieldKey === "scopeOfWork") {
    return isScopeMissing(extraction, ambiguities);
  }

  if (fieldKey === "serviceLocation") {
    const cityMissing = isFieldMissing(extraction, "city", ambiguities);
    const addressMissing = isFieldMissing(extraction, "address", ambiguities);
    if (cityMissing && addressMissing) {
      return cityMissing === "ambiguous" || addressMissing === "ambiguous"
        ? "ambiguous"
        : "empty";
    }
    return null;
  }

  if (fieldKey in extraction) {
    return isFieldMissing(extraction, fieldKey as ConfidenceFieldKey, ambiguities);
  }

  return null;
}

export function detectMissingFields(
  extraction: VoiceIntakeExtraction,
  locale: Locale,
  industry: WorkspaceIndustry,
): MissingFieldInfo[] {
  const config = getIndustryExperienceConfig(industry);
  const ambiguities = new Set(extraction.ambiguities.map((a) => a.field));
  const missing: MissingFieldInfo[] = [];

  for (const fieldKey of config.voice.missingFieldKeys) {
    if (config.voice.ignoredExtractionKeys.includes(fieldKey)) {
      continue;
    }

    const reason = isConfiguredFieldMissing(fieldKey, extraction, ambiguities);
    if (reason) {
      missing.push({
        fieldKey,
        label: labelFor(fieldKey, locale),
        reason,
        priority: fieldKey === "contact" ? "contact" : "key",
      });
    }
  }

  if (config.segment === "construction") {
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
  }

  return missing;
}

export function canShowFollowUpCta(): boolean {
  return true;
}
