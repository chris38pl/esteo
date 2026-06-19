import { loadServicesScenarios } from "@evals/engine/load-scenarios";
import { polishTermMatch } from "@evals/engine/lib/text-utils";
import { scoreCoverage } from "@evals/engine/scorers/coverage-scorer";
import { scoreDomainLeakage } from "@evals/engine/scorers/domain-leakage-scorer";
import { scoreRules } from "@evals/engine/scorers/rule-scorer";
import { scoreSchema } from "@evals/engine/scorers/schema-scorer";
import type { EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";

const sample: EstimateDraftOutput = {
  sections: [
    {
      title: "Usługi",
      sortOrder: 0,
      items: [
        {
          name: "Koordynacja dnia ślubu",
          unit: "h",
          quantity: 10,
          unitPrice: 200,
          vatRate: 0.23,
          sortOrder: 0,
        },
        {
          name: "Harmonogram i spotkania z podwykonawcami",
          unit: "h",
          quantity: 4,
          unitPrice: 180,
          vatRate: 0.23,
          sortOrder: 1,
        },
      ],
    },
  ],
  suggestedMarginPercent: null,
};

const scenarios = loadServicesScenarios(process.cwd());
const wedding = scenarios.find((s) => s.id === "wedding-planner");
if (!wedding) {
  throw new Error("wedding-planner missing");
}

const sampleWithExclusions: EstimateDraftOutput = {
  sections: [
    {
      title: "Zakres",
      sortOrder: 0,
      items: [
        {
          name: "Wyłączenia: catering, transport",
          unit: null,
          quantity: 1,
          unitPrice: 0,
          vatRate: 0.23,
          sortOrder: 0,
        },
      ],
    },
    {
      title: "Usługi",
      sortOrder: 1,
      items: [
        {
          name: "Koordynacja dnia ślubu",
          unit: "h",
          quantity: 10,
          unitPrice: 200,
          vatRate: 0.23,
          sortOrder: 0,
        },
      ],
    },
  ],
  suggestedMarginPercent: null,
};

const schema = scoreSchema(sample);
const rules = scoreRules(sample, wedding.expectations);
const exclusionRules = scoreRules(sampleWithExclusions, wedding.expectations);
const coverage = scoreCoverage(sample, wedding.expectations.coverageTerms);
const leakage = scoreDomainLeakage(sample, "construction", 0);

console.log("schema", schema.passed);
console.log("rules", rules.score, rules.passed);
console.log("mustNot exclusions", exclusionRules.checks.filter((c) => c.id.startsWith("mustNot")).map((c) => `${c.id}=${c.passed}`).join(", "));
console.log("coverage", `${coverage.matched}/${coverage.total}`);
console.log("leakage", leakage.score, leakage.passed);

// Polish inflection matcher
const matcherChecks = [
  ["spotkania z podwykonawcami", "spotkanie", true],
  ["dekoracja sali", "dekoracje", true],
  ["koordynacja wesela", "koordynacje", true],
  ["marketing agency", "market", false],
  ["Tworzenie postów na LinkedIn", "post", true],
  ["posty w mediach społecznościowych", "post", true],
  ["postami sponsorowanymi", "post", true],
  ["Spotkania z podwykonawcami", "podwykonawc", true],
  ["Obsługa kelnerska", "kelner", true],
  ["Pakiet marketingowy", "marketing", true],
  ["Sesja zdjęciowa", "zdjęcia", true],
  ["Fotografia ślubna i plenerowa", "plener", true],
  ["Lekcje angielskiego biznesowego", "angielski", true],
  ["Przygotowanie umowy najmu", "najem", true],
  ["Mycie okien", "okna", true],
  ["Copywriting: Strona główna", "copy", true],
  ["Pośrednictwo w sprzedaży", "pośrednictw", true],
  ["Prowadzenie social-media", "social", true],
  ["Strategia link building", "link", true],
  ["Budowanie linków", "link", true],
] as const;

for (const [haystack, term, expected] of matcherChecks) {
  const got = polishTermMatch(haystack, term);
  if (got !== expected) {
    console.error(`polishTermMatch failed: "${haystack}" ~ "${term}" expected ${expected} got ${got}`);
    process.exit(1);
  }
}
console.log("polishTermMatch OK");

if (!schema.passed || !leakage.passed || coverage.matched < 2) {
  process.exit(1);
}

const mustNotChecks = exclusionRules.checks.filter((c) => c.id.startsWith("mustNotHave:"));
if (!mustNotChecks.every((c) => c.passed)) {
  console.error("mustNot should pass when forbidden terms appear only in Zakres exclusion lines");
  process.exit(1);
}

console.log("scorer smoke test OK");
