import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";

type PropertyType = "apartment" | "house" | "office" | "commercial" | "other";
type ConfidenceField<T> = { value: T; confidence: number };

const REGION_NOT_CITY = [
  "mazury",
  "podhale",
  "pomorze",
  "kaszuby",
  "tatry",
  "beskidy",
];

const NEAR_CITY_PATTERNS: { pattern: RegExp; city: string }[] = [
  { pattern: /\bpod\s+warszaw/i, city: "Warszawa" },
  { pattern: /\bpod\s+poznan/i, city: "Poznań" },
  { pattern: /\bokolice\s+krakow/i, city: "Kraków" },
  { pattern: /\bokolice\s+warszaw/i, city: "Warszawa" },
  { pattern: /\bokolice\s+poznan/i, city: "Poznań" },
  { pattern: /\bnear\s+warsaw/i, city: "Warszawa" },
  { pattern: /\bnear\s+poznan/i, city: "Poznań" },
  { pattern: /\bnear\s+krakow/i, city: "Kraków" },
];

const PROPERTY_TYPE_SYNONYMS: { type: PropertyType; patterns: RegExp[] }[] = [
  {
    type: "apartment",
    patterns: [
      /\bmieszkan/i,
      /\bapartament/i,
      /\bkawalerk/i,
      /\bpenthouse\b/i,
      /\bapartment\b/i,
      /\bflat\b/i,
      /\bcondo\b/i,
    ],
  },
  {
    type: "house",
    patterns: [
      /\bdom\b/i,
      /\bdom\s+jednorodzinn/i,
      /\bbli[zź]niak/i,
      /\bszeregow/i,
      /\bdom\s+letniskow/i,
      /\bhouse\b/i,
      /\bdetached\s+house\b/i,
      /\bsemi[- ]detached\b/i,
      /\btownhouse\b/i,
    ],
  },
  {
    type: "office",
    patterns: [/\bbiuro\b/i, /\bopen\s+space\b/i, /\boffice\b/i],
  },
  {
    type: "commercial",
    patterns: [
      /\blokal\s+u[zż]ytow/i,
      /\blokal\s+handlow/i,
      /\bhala\b/i,
      /\bretail\s+unit\b/i,
      /\bshop\b/i,
      /\bcommercial\s+property\b/i,
      /\bwarehouse\b/i,
      /\bmagazynow/i,
    ],
  },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function isRegionNotCity(value: string): boolean {
  const normalized = normalizeText(value);
  return REGION_NOT_CITY.some(
    (region) => normalized === region || normalized.includes(region),
  );
}

export function inferNearCityFromText(text: string): { city: string; confidence: number } | null {
  const normalized = normalizeText(text);
  for (const { pattern, city } of NEAR_CITY_PATTERNS) {
    if (pattern.test(normalized)) {
      return { city, confidence: 0.4 };
    }
  }
  return null;
}

export function inferPropertyTypeFromText(text: string): PropertyType | null {
  for (const entry of PROPERTY_TYPE_SYNONYMS) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      return entry.type;
    }
  }
  return null;
}

export function normalizeCityField(
  city: ConfidenceField<string | null>,
  sourceText: string,
): ConfidenceField<string | null> {
  if (city.value && isRegionNotCity(city.value)) {
    return { value: null, confidence: 0 };
  }

  const nearCity = inferNearCityFromText(sourceText);
  if (nearCity && (!city.value || city.confidence < 0.5)) {
    return { value: nearCity.city, confidence: nearCity.confidence };
  }

  if (city.value && nearCity && normalizeText(city.value) === normalizeText(nearCity.city)) {
    return {
      value: city.value,
      confidence: Math.min(city.confidence, 0.5),
    };
  }

  return city;
}

function transcriptMentionsArea(text: string): boolean {
  return /\d+\s*(m²|m2|mkw|metr|meter|sqm|square)/i.test(text);
}

function isVagueTranscript(transcript: string): boolean {
  const trimmed = transcript.trim();
  return (
    trimmed.length < 80 &&
    !transcriptMentionsArea(trimmed) &&
    inferPropertyTypeFromText(trimmed) === null &&
    inferNearCityFromText(trimmed) === null &&
    !/\b(wrze[sś]ni|grudni|wiosn|asap|piln|termin|miesi[aą]c|kwarta)/i.test(trimmed)
  );
}

export function normalizeVoiceIntakeExtraction(input: {
  extraction: VoiceIntakeExtraction;
  transcript: string;
}): VoiceIntakeExtraction {
  const result = { ...input.extraction };
  const sourceText = [
    input.transcript,
    input.extraction.description.value ?? "",
    input.extraction.projectSummary.value ?? "",
  ].join("\n");

  if (isVagueTranscript(input.transcript)) {
    result.city = { value: null, confidence: 0 };
    result.area = { value: null, confidence: 0 };
    result.propertyType = { value: null, confidence: 0 };
    result.preferredStartDate = { value: null, confidence: 0 };
    return result;
  }

  result.city = normalizeCityField(result.city, sourceText);

  const inferredType = inferPropertyTypeFromText(sourceText);
  const current = result.propertyType;

  if (!inferredType && current.confidence < 0.85) {
    result.propertyType = { value: null, confidence: 0 };
  } else if (
    inferredType &&
    (current.value === null ||
      current.value === "other" ||
      current.confidence < 0.7)
  ) {
    result.propertyType = {
      value: inferredType,
      confidence: Math.max(current.confidence, 0.75),
    };
  }

  if (!transcriptMentionsArea(sourceText) && result.area.confidence < 0.85) {
    result.area = { value: null, confidence: 0 };
  } else if (
    result.area.value !== null &&
    result.area.value < 15 &&
    /\b(łazienk\w*|lazienk\w*|bathroom)\b/i.test(sourceText) &&
    !/\b(mieszkan|dom|lokal|biur|apartment|house)\b/i.test(sourceText)
  ) {
    result.area = { value: null, confidence: 0 };
  }

  return result;
}
