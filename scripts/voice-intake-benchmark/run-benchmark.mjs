import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFiles } from "../load-env.mjs";
import { scoreAmbiguity, scoreFixture } from "./score-extraction.mjs";

loadEnvFiles();

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(__dirname, "fixtures.json"), "utf8"));

const { extractVoiceIntake } = await import("../../src/ai/services/extract-voice-intake.ts");

const FIELD_DEFINITIONS = [
  {
    key: "property_type",
    label: "Typ nieruchomości",
    valueType: "SELECT",
    required: true,
    options: [
      { value: "apartment", label: "Mieszkanie" },
      { value: "house", label: "Dom" },
      { value: "office", label: "Biuro" },
      { value: "commercial", label: "Lokal użytkowy" },
      { value: "other", label: "Inne" },
    ],
  },
  {
    key: "area_size",
    label: "Powierzchnia",
    valueType: "NUMBER",
    required: true,
  },
];

const FIELD_KEYS = ["city", "area", "preferredStartDate", "propertyType", "scopeOfWork"];
const MIN_ACCURACY = 0.9;
const MIN_PER_FIELD = 0.85;

async function main() {
  const filterId = process.argv[2];
  const selected = filterId
    ? fixtures.filter((fixture) => fixture.id === filterId)
    : fixtures;

  const accuracyFixtures = selected.filter((fixture) => !fixture.ambiguity);
  const ambiguityFixtures = selected.filter((fixture) => fixture.ambiguity);

  const fieldTotals = Object.fromEntries(FIELD_KEYS.map((key) => [key, 0]));
  let ambiguityPassed = 0;

  for (const fixture of selected) {
    const extraction = await extractVoiceIntake({
      transcript: fixture.transcript,
      transcriptLocale: fixture.locale,
      outputTextLocale: "pl",
      fieldDefinitions: FIELD_DEFINITIONS,
    });

    console.log(`\n${fixture.id}`);

    if (fixture.ambiguity) {
      const pass = scoreAmbiguity(fixture.expected, extraction);
      ambiguityPassed += pass;
      console.log(`  ${pass ? "OK" : "MISS"} ambiguity: expected all null for city/area/propertyType/preferredStartDate`);
      if (!pass) {
        console.log(
          `    got city=${JSON.stringify(extraction.city?.value)} area=${JSON.stringify(extraction.area?.value)} propertyType=${JSON.stringify(extraction.propertyType?.value)} preferredStartDate=${JSON.stringify(extraction.preferredStartDate?.value)}`,
        );
      }
      continue;
    }

    const scores = scoreFixture(fixture.expected, extraction);

    for (const key of FIELD_KEYS) {
      const score = scores[key];
      fieldTotals[key] += score;
      const mark = score === 1 ? "OK" : "MISS";
      const gotValue =
        key === "scopeOfWork"
          ? extraction.scopeOfWork?.items
          : extraction[key]?.value ?? null;
      console.log(`  ${mark} ${key}: expected=${JSON.stringify(fixture.expected[key])} got=${JSON.stringify(gotValue)}`);
    }
  }

  console.log("\n--- Summary ---");

  let failed = false;

  const accuracyCount = accuracyFixtures.length;
  const overall =
    accuracyCount === 0
      ? 1
      : FIELD_KEYS.reduce((sum, key) => sum + fieldTotals[key], 0) /
        (accuracyCount * FIELD_KEYS.length);

  const accuracyPass = overall >= MIN_ACCURACY;
  if (!accuracyPass) failed = true;

  console.log(`Accuracy: ${(overall * 100).toFixed(1)}% ${accuracyPass ? "PASS" : "FAIL"}`);

  const ambiguityTotal = ambiguityFixtures.length;
  const ambiguityPass = ambiguityPassed === ambiguityTotal && ambiguityTotal > 0;
  if (ambiguityTotal > 0 && !ambiguityPass) failed = true;

  console.log(
    `Ambiguity Handling: ${ambiguityPassed}/${ambiguityTotal} ${ambiguityPass ? "PASS" : "FAIL"}`,
  );

  for (const key of FIELD_KEYS) {
    if (accuracyCount === 0) continue;
    const fieldAccuracy = fieldTotals[key] / accuracyCount;
    const pass = fieldAccuracy >= MIN_PER_FIELD;
    if (!pass) failed = true;
    console.log(`${key}: ${(fieldAccuracy * 100).toFixed(1)}% ${pass ? "PASS" : "FAIL"}`);
  }

  if (failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
