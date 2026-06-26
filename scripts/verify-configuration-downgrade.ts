import { buildEvalGenerationContext } from "@evals/engine/build-eval-context";
import { buildEstimateDraftPrompt } from "@/ai/prompts/estimate-draft";
import type { EvalScenario } from "@evals/engine/schemas/scenario";
import { scoreConfigurationLifecycle } from "@evals/engine/scorers/configuration-lifecycle-scorer";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const downgradeScenario = {
  id: "verify-downgrade",
  name: "verify-downgrade",
  locale: "pl" as const,
  category: "business" as const,
  quick: false,
  critical: false,
  workspace: {
    industry: "CONSTRUCTION" as const,
    industryOtherText: "",
    companyDescription: "Test",
    subscriptionPlan: "FREE" as const,
    subscriptionStatus: "ACTIVE" as const,
    template: {
      id: "template-stored",
      name: "Stored Template",
      generationMode: "SMART" as const,
      currency: "PLN",
      sections: [
        {
          title: "Sekcja",
          items: [{ name: "Pozycja", unit: "m²", unitPrice: "10.00" }],
        },
      ],
    },
    rules: [],
  },
  request: { project: { description: "Test brief" } },
  expectations: {
    mustHave: [],
    mustNotHave: [],
    coverageTerms: [],
    requiredSections: [],
    forbiddenSections: [],
    leakageDomain: "construction" as const,
    maxLeakageTerms: 0,
    minLineItems: 0,
    maxLineItems: 100,
    configurationLifecycle: {
      templateInPrompt: false,
      priceListInPrompt: false,
      promptMustContain: [],
      promptMustNotContain: [],
    },
  },
} satisfies EvalScenario;

const snapshotScenario = {
  id: "verify-snapshot",
  name: "verify-snapshot",
  locale: "pl" as const,
  category: "business" as const,
  quick: false,
  critical: false,
  workspace: {
    industry: "CONSTRUCTION" as const,
    industryOtherText: "",
    companyDescription: "Test",
    subscriptionPlan: "FREE" as const,
    subscriptionStatus: "ACTIVE" as const,
    template: {
      id: "template-live",
      name: "Live Template B",
      generationMode: "SMART" as const,
      currency: "PLN",
      sections: [
        {
          title: "B",
          items: [{ name: "B item", unit: "szt.", unitPrice: "99.00" }],
        },
      ],
    },
    rules: [],
  },
  configurationSnapshot: {
    template: {
      id: "template-snapshot",
      name: "Snapshot Template A",
      generationMode: "SMART" as const,
      currency: "PLN",
      sections: [
        {
          title: "A",
          items: [{ name: "A item", unit: "m²", unitPrice: "18.00" }],
        },
      ],
    },
  },
  request: { project: { description: "Test brief" } },
  expectations: {
    mustHave: [],
    mustNotHave: [],
    coverageTerms: [],
    requiredSections: [],
    forbiddenSections: [],
    leakageDomain: "construction" as const,
    maxLeakageTerms: 0,
    minLineItems: 0,
    maxLineItems: 100,
    configurationLifecycle: {
      promptMustContain: ["Snapshot Template A", "18.00"],
      promptMustNotContain: ["Live Template B", "99.00"],
    },
  },
} satisfies EvalScenario;

for (const scenario of [downgradeScenario, snapshotScenario]) {
  const context = buildEvalGenerationContext(scenario);
  const prompt = buildEstimateDraftPrompt({
    projectBrief: "Test project",
    context,
  });
  const lifecycle = scoreConfigurationLifecycle(prompt, scenario.expectations);
  assert(
    lifecycle.passed,
    `${scenario.id} failed: ${lifecycle.checks.filter((c) => !c.passed).map((c) => c.id).join(", ")}`,
  );
  console.log(`OK ${scenario.id}`);
}

console.log("verify-configuration-downgrade: all checks passed");
