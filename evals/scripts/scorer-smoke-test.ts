import { loadServicesScenarios } from "@evals/engine/load-scenarios";
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

const schema = scoreSchema(sample);
const rules = scoreRules(sample, wedding.expectations);
const coverage = scoreCoverage(sample, wedding.expectations.coverageTerms);
const leakage = scoreDomainLeakage(sample, "construction", 0);

console.log("schema", schema.passed);
console.log("rules", rules.score, rules.passed);
console.log("coverage", `${coverage.matched}/${coverage.total}`);
console.log("leakage", leakage.score, leakage.passed);

if (!schema.passed || !leakage.passed || coverage.matched < 2) {
  process.exit(1);
}

console.log("scorer smoke test OK");
