import assert from "node:assert/strict";
import { WorkspaceIndustry } from "@prisma/client";

import { cleanVoiceTranscript } from "../src/ai/lib/clean-voice-transcript";
import type { VoiceIntakeExtraction } from "../src/ai/schemas/voice-intake-extraction";
import {
  inferNearCityFromText,
  inferPropertyTypeFromText,
  isRegionNotCity,
  normalizeCityField,
} from "../src/ai/lib/voice-intake-normalization";
import { scopeLabelsMatch } from "../src/ai/lib/voice-intake-scope-terms";
import { stabilizeVoiceIntakeMerge } from "../src/ai/services/stabilize-voice-intake-merge";
import {
  buildRecognizedElements,
  capRecognizedElements,
} from "../src/features/voice-intake/lib/build-recognized-elements";
import { buildTitleFromExtraction } from "../src/features/voice-intake/lib/build-title-from-extraction";
import { detectMissingFields } from "../src/features/voice-intake/lib/detect-missing-fields";
import { mapExtractionToForm } from "../src/features/voice-intake/lib/map-extraction-to-form";
import { resolveGeneratedTitle } from "../src/features/voice-intake/lib/resolve-generated-title";
import { trackVoiceCorrectionsOnSubmit } from "../src/features/voice-intake/lib/track-voice-corrections";
import {
  scoreAmbiguity,
  scoreArea,
  scoreCity,
  scoreEnum,
  scoreFixture,
  scoreScopeOfWork,
} from "./voice-intake-benchmark/score-extraction.mjs";

function baseExtraction(overrides: Partial<VoiceIntakeExtraction> = {}): VoiceIntakeExtraction {
  return {
    projectSummary: { value: "Remont mieszkania w Poznaniu.", bullets: [], confidence: 0.9 },
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
      items: [{ label: "łazienka", confidence: 0.9 }],
      confidence: 0.9,
    },
    ambiguities: [],
    locale: "pl",
    ...overrides,
  };
}

function testResolveGeneratedTitle() {
  const extraction = baseExtraction();
  assert.equal(resolveGeneratedTitle("Mój tytuł", extraction, "pl"), "Mój tytuł");
  const title = buildTitleFromExtraction(extraction, "pl");
  assert.ok(title.includes("mieszkanie") || title.includes("Mieszkanie"));
  assert.ok(!title.toLowerCase().includes("null"));
  assert.equal(resolveGeneratedTitle("", extraction, "pl", title), title);
}

function testCleanVoiceTranscript() {
  const raw =
    "gładzie  tynki  listwy  drzwi  panele  lustra\n\nw łazience i kuchni";
  const cleaned = cleanVoiceTranscript(raw);
  for (const token of ["gładzie", "tynki", "listwy", "drzwi", "panele", "lustra"]) {
    assert.ok(cleaned.toLowerCase().includes(token), `missing token: ${token}`);
  }
  assert.ok(cleaned.length >= raw.replace(/\s+/g, " ").trim().length - 5);
}

function testRecognizedElementsCap() {
  const extraction = baseExtraction({
    scopeOfWork: {
      items: Array.from({ length: 20 }, (_, i) => ({
        label: `pozycja ${i + 1}`,
        confidence: 0.9,
      })),
      confidence: 0.9,
    },
  });
  const transcript =
    "gładzie tynki listwy drzwi panele lustra malowanie płytki hydraulika";
  const elements = buildRecognizedElements(extraction, transcript, "pl");
  const capped = capRecognizedElements(elements, 12);
  assert.equal(capped.visible.length, 12);
  assert.ok(capped.overflowCount > 0);
}

function testDetectMissingFields() {
  const missing = detectMissingFields(baseExtraction(), "pl", WorkspaceIndustry.CONSTRUCTION);
  assert.ok(missing.some((item) => item.fieldKey === "preferredStartDate"));
  assert.ok(missing.some((item) => item.fieldKey === "contact"));
}

function testMapExtractionToForm() {
  const extraction = baseExtraction();
  const cleanedTranscript =
    "Remont mieszkania w Poznaniu obejmuje łazienkę, gładzie, tynki, listwy, drzwi i panele.";
  const mapped = mapExtractionToForm({
    extraction,
    descriptionText: cleanedTranscript,
    locale: "pl",
    industry: WorkspaceIndustry.CONSTRUCTION,
    currentTitle: "",
    existingIndustryFields: { property_type: "", area_size: "" },
  });

  assert.equal(mapped.address.city, "Poznań");
  assert.equal(mapped.industryFields.area_size, 68);
  assert.equal(mapped.project.description, cleanedTranscript);
  assert.ok(mapped.project.description.includes("gładzie"));
  assert.equal(mapped.voiceAppliedValues.city, "Poznań");
  assert.equal(mapped.voiceAppliedValues.area, 68);
}

function testScoringHelpers() {
  assert.equal(scoreCity("Poznań", "poznan"), 1);
  assert.equal(scoreArea(68, 69), 1);
  assert.equal(scoreEnum("apartment", "apartment"), 1);

  const scores = scoreFixture(
    {
      city: "Poznań",
      area: 68,
      preferredStartDate: null,
      propertyType: "apartment",
      scopeOfWork: ["łazienka"],
    },
    baseExtraction(),
  );
  assert.equal(scores.city, 1);
  assert.equal(scores.area, 1);
  assert.equal(scores.propertyType, 1);
}

function testScopeSemanticMatching() {
  assert.equal(scopeLabelsMatch("elektryka", "instalacja elektryczna"), true);
  assert.equal(scopeLabelsMatch("podłogi", "wymiana podłóg"), true);
  assert.equal(scopeLabelsMatch("dach", "wymiana dachu"), true);
  assert.equal(scopeLabelsMatch("łazienka", "remont łazienki"), true);
  assert.equal(scopeLabelsMatch("elewacja", "remont elewacji"), true);
  assert.equal(scopeLabelsMatch("okna", "wymiana okien"), true);
  assert.equal(scopeLabelsMatch("malowanie", "remont"), false);
  assert.equal(scopeLabelsMatch("kuchnia", "łazienka"), false);

  assert.equal(
    scoreScopeOfWork(["elektryka"], [{ label: "instalacja elektryczna", confidence: 1 }]),
    1,
  );
}

function testAmbiguityScoring() {
  const pass = scoreAmbiguity(
    { city: null, area: null, propertyType: null, preferredStartDate: null },
    baseExtraction({
      city: { value: null, confidence: 0 },
      area: { value: null, confidence: 0 },
      propertyType: { value: null, confidence: 0 },
      preferredStartDate: { value: null, confidence: 0 },
    }),
  );
  assert.equal(pass, 1);

  const fail = scoreAmbiguity(
    { city: null, area: null, propertyType: null, preferredStartDate: null },
    baseExtraction(),
  );
  assert.equal(fail, 0);
}

function testNormalization() {
  assert.equal(isRegionNotCity("Mazury"), true);
  assert.equal(isRegionNotCity("Poznań"), false);

  const near = inferNearCityFromText("Dom pod Warszawą 120 metrów");
  assert.equal(near?.city, "Warszawa");
  assert.ok((near?.confidence ?? 0) >= 0.3 && (near?.confidence ?? 0) <= 0.5);

  assert.equal(inferPropertyTypeFromText("penthouse 200 m2"), "apartment");
  assert.equal(inferPropertyTypeFromText("dom szeregowy"), "house");

  const normalized = normalizeCityField(
    { value: "Mazury", confidence: 0.8 },
    "Dom na Mazurach",
  );
  assert.equal(normalized.value, null);
  assert.equal(normalized.confidence, 0);
}

function testStabilizeMerge() {
  const previous = baseExtraction({
    city: { value: "Poznań", confidence: 0.95 },
    area: { value: 68, confidence: 0.9 },
  });
  const next = baseExtraction({
    city: { value: "Warszawa", confidence: 0.4 },
    area: { value: 40, confidence: 0.3 },
    preferredStartDate: { value: "asap", confidence: 0.8 },
    phone: { value: "600123456", confidence: 0.9 },
  });

  const merged = stabilizeVoiceIntakeMerge({
    previous,
    next,
    missingFieldKeys: ["preferredStartDate", "phone"],
    followUpTranscript: "Mój telefon to 600 123 456, jak najszybciej.",
  });

  assert.equal(merged.city.value, "Poznań");
  assert.equal(merged.area.value, 68);
  assert.equal(merged.preferredStartDate.value, "asap");
  assert.equal(merged.phone.value, "600123456");
}

function testTrackCorrections() {
  let events = 0;
  const originalDispatch = globalThis.window?.dispatchEvent;
  if (typeof globalThis.window === "undefined") {
    (globalThis as { window?: Window }).window = {
      dispatchEvent: () => true,
    } as unknown as Window;
  }

  const dispatched: string[] = [];
  globalThis.window.dispatchEvent = ((event: Event) => {
    if (event instanceof CustomEvent && event.type === "esteo:voice-analytics") {
      dispatched.push((event.detail as { event: string }).event);
    }
    return true;
  }) as typeof window.dispatchEvent;

  trackVoiceCorrectionsOnSubmit(
    { city: "Poznań", area: 68 },
    { city: "Wrocław", area: 68 },
  );

  assert.ok(dispatched.includes("voice_field_corrected"));
  events = dispatched.length;
  assert.ok(events >= 1);

  if (originalDispatch) {
    globalThis.window.dispatchEvent = originalDispatch;
  }
}

function main() {
  testResolveGeneratedTitle();
  testCleanVoiceTranscript();
  testRecognizedElementsCap();
  testDetectMissingFields();
  testMapExtractionToForm();
  testScoringHelpers();
  testScopeSemanticMatching();
  testAmbiguityScoring();
  testNormalization();
  testStabilizeMerge();
  testTrackCorrections();
  console.log("voice-intake helper tests passed");
}

main();
