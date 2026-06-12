import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";

import { buildConfidenceSummary } from "@/features/voice-intake/lib/build-confidence-summary";
import { detectMissingFields } from "@/features/voice-intake/lib/detect-missing-fields";
import type { ResolvedFieldItem } from "@/features/voice-intake/lib/diff-missing-fields";
import type { MissingFieldInfo, VoiceIntakeErrorCode } from "@/features/voice-intake/types";
import type { Locale } from "@/lib/locale";

export type VoiceIntakePreviewScenarioId = "rich" | "sparse" | "after_follow_up" | "no_new_info";

export type VoiceIntakePreviewPhase =
  | "trigger"
  | "footer_trigger"
  | "recording_initial"
  | "recording_follow_up"
  | "summary"
  | "analyzing"
  | "analyzing_follow_up"
  | "error";

export const VOICE_INTAKE_PREVIEW_PHASES: VoiceIntakePreviewPhase[] = [
  "trigger",
  "footer_trigger",
  "recording_initial",
  "recording_follow_up",
  "summary",
  "analyzing",
  "analyzing_follow_up",
  "error",
];

export const VOICE_INTAKE_PREVIEW_SCENARIOS: VoiceIntakePreviewScenarioId[] = [
  "rich",
  "sparse",
  "after_follow_up",
  "no_new_info",
];

export const VOICE_INTAKE_PREVIEW_ERROR_CODES: VoiceIntakeErrorCode[] = [
  "mic_denied",
  "recording_too_short",
  "recording_too_long",
  "empty_audio",
  "audio_too_large",
  "rate_limited",
  "transcription_failed",
  "extraction_failed",
  "captcha_failed",
  "unauthorized",
  "entitlement_exceeded",
  "unavailable",
  "invalid",
];

const CLEANED_TRANSCRIPT_PL =
  "Remont mieszkania w Poznaniu obejmuje łazienkę, gładzie, tynki, listwy, drzwi i panele. Powierzchnia około 68 metrów kwadratowych.";

const CLEANED_TRANSCRIPT_EN =
  "Apartment renovation in Poznań includes bathroom, skim coating, plaster, trim, doors and panels. Area about 68 square meters.";

export function baseVoiceIntakeExtraction(
  overrides: Partial<VoiceIntakeExtraction> = {},
): VoiceIntakeExtraction {
  return {
    projectSummary: {
      value: "Remont mieszkania w Poznaniu.",
      bullets: [],
      confidence: 0.9,
    },
    generatedTitle: { value: "Remont mieszkania 68 m² – Poznań", confidence: 0.9 },
    description: { value: "Remont mieszkania z łazienką.", confidence: 0.85 },
    propertyType: { value: "apartment", confidence: 0.9 },
    address: { value: null, confidence: 0 },
    city: { value: "Poznań", confidence: 0.92 },
    postalCode: { value: null, confidence: 0 },
    voivodeship: { value: null, confidence: 0 },
    area: { value: 68, confidence: 0.88 },
    preferredStartDate: { value: null, confidence: 0 },
    fullName: { value: null, confidence: 0 },
    email: { value: null, confidence: 0 },
    phone: { value: null, confidence: 0 },
    scopeOfWork: {
      items: [
        { label: "łazienka", confidence: 0.9 },
        { label: "gładzie", confidence: 0.88 },
        { label: "tynki", confidence: 0.86 },
      ],
      confidence: 0.9,
    },
    ambiguities: [],
    locale: "pl",
    ...overrides,
  };
}

function sparseExtraction(locale: Locale): VoiceIntakeExtraction {
  return baseVoiceIntakeExtraction({
    locale,
    city: { value: null, confidence: 0 },
    area: { value: null, confidence: 0 },
    propertyType: { value: null, confidence: 0 },
    scopeOfWork: { items: [], confidence: 0 },
    description: { value: null, confidence: 0 },
    projectSummary: { value: null, bullets: [], confidence: 0.3 },
    generatedTitle: { value: null, confidence: 0 },
  });
}

function afterFollowUpExtraction(locale: Locale): VoiceIntakeExtraction {
  return baseVoiceIntakeExtraction({
    locale,
    preferredStartDate: { value: "1_3_months", confidence: 0.88 },
    phone: { value: "+48 600 100 200", confidence: 0.91 },
    fullName: { value: "Jan Kowalski", confidence: 0.9 },
  });
}

export type VoiceIntakePreviewFixture = {
  scenarioId: VoiceIntakePreviewScenarioId;
  locale: Locale;
  extraction: VoiceIntakeExtraction;
  transcript: string;
  cleanedTranscript: string;
  followUpTranscript: string | null;
  displayDescription: string;
  missingFields: MissingFieldInfo[];
  confidenceSummary: ReturnType<typeof buildConfidenceSummary>;
  followUpResolvedItems: ResolvedFieldItem[];
  followUpStillMissing: MissingFieldInfo[];
  followUpNoNewInfo: boolean;
};

const PREVIEW_RESOLVED_POOL_PL: ResolvedFieldItem[] = [
  { fieldKey: "city", displayValue: "Szczecin" },
  { fieldKey: "area", displayValue: "57 m²" },
  { fieldKey: "preferredStartDate", displayValue: "1–3 miesiące" },
  { fieldKey: "phone", displayValue: "+48 600 100 200" },
  { fieldKey: "propertyType", displayValue: "Mieszkanie" },
  { fieldKey: "scope", displayValue: "Remont łazienki" },
  { fieldKey: "fullName", displayValue: "Jan Kowalski" },
  { fieldKey: "postalCode", displayValue: "70-001" },
];

const PREVIEW_RESOLVED_POOL_EN: ResolvedFieldItem[] = [
  { fieldKey: "city", displayValue: "Szczecin" },
  { fieldKey: "area", displayValue: "57 m²" },
  { fieldKey: "preferredStartDate", displayValue: "1–3 months" },
  { fieldKey: "phone", displayValue: "+48 600 100 200" },
  { fieldKey: "propertyType", displayValue: "Apartment" },
  { fieldKey: "scope", displayValue: "Bathroom renovation" },
  { fieldKey: "fullName", displayValue: "John Smith" },
  { fieldKey: "postalCode", displayValue: "70-001" },
];

export function pickRandomPreviewResolvedItems(locale: Locale, count = 3): ResolvedFieldItem[] {
  const pool = locale === "pl" ? PREVIEW_RESOLVED_POOL_PL : PREVIEW_RESOLVED_POOL_EN;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function buildVoiceIntakePreviewFixture(
  scenarioId: VoiceIntakePreviewScenarioId,
  locale: Locale,
): VoiceIntakePreviewFixture {
  const cleanedTranscript = locale === "pl" ? CLEANED_TRANSCRIPT_PL : CLEANED_TRANSCRIPT_EN;
  const transcript =
    locale === "pl"
      ? "Chcę zrobić remont mieszkania w Poznaniu, około sześćdziesiąt osiem metrów, łazienka, gładzie, tynki…"
      : "I want to renovate an apartment in Poznań, about sixty-eight square meters, bathroom, skim coat, plaster…";

  let extraction: VoiceIntakeExtraction;
  let followUpTranscript: string | null = null;
  let followUpResolvedItems: ResolvedFieldItem[] = [];
  let followUpStillMissing: MissingFieldInfo[] = [];
  let followUpNoNewInfo = false;

  switch (scenarioId) {
    case "sparse":
      extraction = sparseExtraction(locale);
      break;
    case "after_follow_up":
      extraction = afterFollowUpExtraction(locale);
      followUpTranscript =
        locale === "pl"
          ? "Termin to jeden do trzech miesięcy, telefon sześćset sto dwieście."
          : "Timeline is one to three months, phone six zero zero one zero zero two zero zero.";
      {
        const beforeMissing = detectMissingFields(baseVoiceIntakeExtraction({ locale }), locale);
        const afterMissing = detectMissingFields(extraction, locale);
        const resolvedKeys = new Set(
          beforeMissing
            .filter((m) => !afterMissing.some((a) => a.fieldKey === m.fieldKey))
            .map((m) => m.fieldKey),
        );
        followUpResolvedItems = [
          resolvedKeys.has("preferredStartDate")
            ? {
                fieldKey: "preferredStartDate",
                displayValue: locale === "pl" ? "1–3 miesiące" : "1–3 months",
              }
            : null,
          resolvedKeys.has("contact") || resolvedKeys.has("phone")
            ? { fieldKey: "phone", displayValue: "+48 600 100 200" }
            : null,
        ].filter((item): item is ResolvedFieldItem => item !== null);
        followUpStillMissing = afterMissing.filter(
          (m) => m.priority === "key" || m.priority === "contact",
        );
      }
      break;
    case "no_new_info":
      extraction = baseVoiceIntakeExtraction({ locale });
      followUpTranscript = locale === "pl" ? "Hmm, nie wiem." : "Hmm, I don't know.";
      followUpNoNewInfo = true;
      followUpStillMissing = detectMissingFields(extraction, locale).filter(
        (m) => m.priority === "key" || m.priority === "contact",
      );
      break;
    case "rich":
    default:
      extraction = baseVoiceIntakeExtraction({ locale });
      break;
  }

  const missingFields = detectMissingFields(extraction, locale);

  return {
    scenarioId,
    locale,
    extraction,
    transcript,
    cleanedTranscript,
    followUpTranscript,
    displayDescription: cleanedTranscript,
    missingFields,
    confidenceSummary: buildConfidenceSummary(extraction),
    followUpResolvedItems,
    followUpStillMissing,
    followUpNoNewInfo,
  };
}
