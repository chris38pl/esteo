import type { Locale } from "@/lib/locale";

export function formatReferenceDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildVoiceIntakeSharedRules(input: {
  referenceDate: Date;
  transcriptLocale: Locale;
  outputTextLocale: Locale;
}): string {
  const today = formatReferenceDate(input.referenceDate);
  const outputLabel = input.outputTextLocale === "pl" ? "Polish" : "English";

  return `Today's date: ${today}

Locale rules:
- The transcript is in ${input.transcriptLocale === "pl" ? "Polish" : "English"} — understand it in that language.
- projectSummary.value and projectSummary.bullets must be written in ${outputLabel}.
- generatedTitle must be written in ${outputLabel}.
- Structured enums and numbers are language-independent.

Uncertainty (critical):
- If information is missing or ambiguous, set value to null and confidence to 0.
- Do NOT guess cities, areas, property types, or timelines from vague input.
- Prefer null over hallucination.

preferredStartDate mapping (relative to today's date):
Polish → enum:
- asap: jak najszybciej, pilne, natychmiast, od zaraz
- 1_3_months: za miesiąc, w przyszłym miesiącu, wrzesień, październik, grudzień (when within ~1-3 months from today)
- 3_6_months: wiosna, lato, jesień, drugi kwartał, trzeci kwartał, za kilka miesięcy, za 3-6 miesięcy
- 6_12_months: przyszły rok, wiosna przyszłego roku, za pół roku do roku, za 6-12 miesięcy
- flexible: termin elastyczny, bez presji czasowej
English → enum:
- asap: ASAP, as soon as possible, urgent, immediately
- 1_3_months: next month, September, October, December (when within ~1-3 months from today)
- 3_6_months: spring, summer, autumn, Q2, Q3, in a few months, 3-6 months
- 6_12_months: next year, during next year, 6-12 months
- flexible: flexible timeline, no fixed deadline
If timeline is ambiguous → preferredStartDate: null, confidence: 0.

city rules:
- city = a specific city name (e.g. Poznań, Kraków). Districts map to parent city (Wilda → Poznań).
- Regions are NOT cities — set city to null, confidence 0: Mazury, Podhale, Pomorze, Kaszuby, Tatry, Beskidy.
- Near-city phrases ("pod Poznaniem", "pod Warszawą", "okolice Krakowa"): set city to the referenced city with confidence 0.3-0.5.

propertyType mapping:
- apartment: mieszkanie, apartament, kawalerka, penthouse, apartment, flat, condo
- house: dom, dom jednorodzinny, bliźniak, szeregowiec, dom letniskowy, house, detached house, semi-detached, townhouse
- office: biuro, open space, office
- commercial: lokal użytkowy, lokal handlowy, hala, retail unit, shop, commercial property
- If property type cannot be determined → null, confidence 0.

scopeOfWork.items: short natural labels in the transcript language (do not normalize to canonical codes).
- area = total property size in m², not a single room, unless only one room is described as the whole project.
- For vague requests without property/location/size signals, keep city, area, propertyType, and preferredStartDate null.`;
}

export function buildVoiceIntakeFollowUpPatchRules(): string {
  return `Follow-up extraction is a PATCH operation, NOT a full re-extraction:
- Start from the previous extraction and preserve all fields with confidence >= 0.5 unless the follow-up explicitly contradicts them.
- Update ONLY fields that were missing or ambiguous, or fields the follow-up clearly supplies or corrects.
- Do NOT null out correctly extracted fields unless the follow-up explicitly contradicts them.
- Do NOT reduce confidence of accepted values without explicit contradiction in the follow-up transcript.
- Do NOT overwrite high-confidence fields (>= 0.85) unless the follow-up explicitly contradicts them.`;
}
