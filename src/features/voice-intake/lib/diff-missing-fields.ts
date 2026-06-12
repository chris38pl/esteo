import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import {
  getStartDateLabel,
  type StartDateKey,
} from "@/features/estimate-requests/config/start-dates";
import type { MissingFieldInfo } from "@/features/voice-intake/types";
import type { Locale } from "@/lib/locale";

export type ResolvedFieldItem = {
  fieldKey: string;
  displayValue: string;
};

function displayValueForResolvedField(
  fieldKey: string,
  extraction: VoiceIntakeExtraction,
  locale: Locale,
): string | null {
  switch (fieldKey) {
    case "city":
      return extraction.city.value;
    case "area":
      return extraction.area.value !== null ? `${extraction.area.value} m²` : null;
    case "propertyType":
      if (!extraction.propertyType.value) return null;
      return getIndustryOptionLabel(
        "property_type",
        extraction.propertyType.value,
        locale,
        "label",
      );
    case "preferredStartDate": {
      const v = extraction.preferredStartDate.value;
      if (!v) return null;
      try {
        return getStartDateLabel(v as StartDateKey, locale);
      } catch {
        return String(v);
      }
    }
    case "scopeOfWork":
      return extraction.scopeOfWork.items.map((i) => i.label).join(", ") || null;
    case "contact":
      if (extraction.phone.value && extraction.phone.confidence >= 0.5) {
        return extraction.phone.value;
      }
      if (extraction.fullName.value && extraction.fullName.confidence >= 0.5) {
        return extraction.fullName.value;
      }
      if (extraction.email.value && extraction.email.confidence >= 0.5) {
        return extraction.email.value;
      }
      return locale === "pl" ? "Kontakt" : "Contact";
    case "fullName":
      return extraction.fullName.value;
    case "email":
      return extraction.email.value;
    case "phone":
      return extraction.phone.value;
    default:
      return null;
  }
}

export function diffMissingFields(input: {
  previousMissing: MissingFieldInfo[];
  currentMissing: MissingFieldInfo[];
  extraction: VoiceIntakeExtraction;
  locale: Locale;
}): {
  resolvedItems: ResolvedFieldItem[];
  stillMissing: MissingFieldInfo[];
  noNewInfo: boolean;
} {
  const currentKeys = new Set(input.currentMissing.map((m) => m.fieldKey));
  const resolvedKeys = input.previousMissing
    .filter((m) => m.priority === "key" || m.priority === "contact")
    .filter((m) => !currentKeys.has(m.fieldKey));

  const resolvedItems: ResolvedFieldItem[] = [];

  for (const missing of resolvedKeys) {
    const displayValue = displayValueForResolvedField(
      missing.fieldKey,
      input.extraction,
      input.locale,
    );
    if (displayValue) {
      resolvedItems.push({ fieldKey: missing.fieldKey, displayValue });
    }
  }

  const stillMissing = input.currentMissing.filter(
    (m) => m.priority === "key" || m.priority === "contact",
  );

  return {
    resolvedItems,
    stillMissing,
    noNewInfo: resolvedItems.length === 0,
  };
}
