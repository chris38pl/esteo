import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";

import type { MissingFieldInfo } from "@/features/voice-intake/types";
import type { Locale } from "@/lib/locale";

export type ReviewBullet = {
  label: string;
  status: "recognized" | "missing";
};

const MISSING_BULLET_LABELS: Record<string, { pl: string; en: string }> = {
  propertyType: {
    pl: "Nie rozpoznałem typu nieruchomości",
    en: "Property type not recognized",
  },
  city: { pl: "Nie rozpoznałem miasta", en: "City not recognized" },
  area: { pl: "Nie rozpoznałem powierzchni", en: "Area not recognized" },
  preferredStartDate: {
    pl: "Nie rozpoznałem terminu realizacji",
    en: "Start date not recognized",
  },
  scopeOfWork: {
    pl: "Nie rozpoznałem zakresu prac",
    en: "Scope of work not recognized",
  },
  contact: {
    pl: "Nie rozpoznałem danych kontaktowych",
    en: "Contact details not recognized",
  },
};

export function buildReviewBullets(
  extraction: VoiceIntakeExtraction,
  missingFields: MissingFieldInfo[],
  locale: Locale,
): ReviewBullet[] {
  const bullets: ReviewBullet[] = [];
  const missingKeys = new Set(
    missingFields.filter((m) => m.priority === "key" || m.priority === "contact").map((m) => m.fieldKey),
  );

  for (const bullet of extraction.projectSummary.bullets) {
    bullets.push({
      label: bullet.label,
      status: bullet.confidence >= 0.5 ? "recognized" : "missing",
    });
  }

  for (const key of missingKeys) {
    const template = MISSING_BULLET_LABELS[key];
    if (template) {
      bullets.push({
        label: template[locale],
        status: "missing",
      });
    }
  }

  return bullets;
}
