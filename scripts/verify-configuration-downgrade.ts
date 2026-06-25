import { buildEvalGenerationContext } from "@evals/engine/build-eval-context";
import { buildEstimateDraftPrompt } from "@/ai/prompts/estimate-draft";
import type { EvalScenario } from "@evals/engine/schemas/scenario";
import { scoreConfigurationLifecycle } from "@evals/engine/scorers/configuration-lifecycle-scorer";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const downgradeScenario: EvalScenario = {
  id: "verify-downgrade",
  name: "verify-downgrade",
  locale: "pl",
  category: "business",
  workspace: {
    industry: "CONSTRUCTION",
    companyDescription: "Test",
    subscriptionPlan: "FREE",
    subscriptionStatus: "ACTIVE",
    template: {
      name: "Stored Template",
      sections: [{ title: "Sekcja", items: [{ name: "Pozycja" }] }],
    },
    priceList: {
      name: "Stored Price List",
      currency: "PLN",
      items: [{ name: "Pozycja", unit: "m²", unitPrice: "10.00" }],
    },
    rules: [],
  },
  request: { project: { description: "Test brief" } },
  expectations: {
    configurationLifecycle: {
      templateInPrompt: false,
      priceListInPrompt: false,
    },
  },
};

const snapshotScenario: EvalScenario = {
  id: "verify-snapshot",
  name: "verify-snapshot",
  locale: "pl",
  category: "business",
  workspace: {
    industry: "CONSTRUCTION",
    companyDescription: "Test",
    subscriptionPlan: "FREE",
    subscriptionStatus: "ACTIVE",
    template: {
      name: "Live Template B",
      sections: [{ title: "B", items: [{ name: "B item" }] }],
    },
    priceList: {
      name: "Live Price B",
      currency: "PLN",
      items: [{ name: "B price", unit: "szt.", unitPrice: "99.00" }],
    },
    rules: [],
  },
  configurationSnapshot: {
    template: {
      name: "Snapshot Template A",
      sections: [{ title: "A", items: [{ name: "A item" }] }],
    },
    priceList: {
      name: "Snapshot Price A",
      currency: "PLN",
      items: [{ name: "A price", unit: "m²", unitPrice: "18.00" }],
    },
  },
  request: { project: { description: "Test brief" } },
  expectations: {
    configurationLifecycle: {
      promptMustContain: ["Snapshot Template A", "18.00"],
      promptMustNotContain: ["Live Template B", "99.00"],
    },
  },
};

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
