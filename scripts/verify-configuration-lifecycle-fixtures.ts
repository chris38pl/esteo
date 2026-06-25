import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { buildEvalGenerationContext } from "@evals/engine/build-eval-context";
import { buildEvalProjectBrief } from "@evals/engine/build-eval-brief";
import { evalScenarioSchema } from "@evals/engine/schemas/scenario";
import { scoreConfigurationLifecycle } from "@evals/engine/scorers/configuration-lifecycle-scorer";
import { buildEstimateDraftPrompt } from "@/ai/prompts/estimate-draft";

const configurationDir = join(process.cwd(), "evals", "configuration");
const lifecycleIds = new Set([
  "configuration-retry-snapshot",
  "configuration-downgrade-free",
]);

function collectJsonFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => join(dir, name));
}

for (const file of collectJsonFiles(configurationDir)) {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  if (!lifecycleIds.has(raw.id)) {
    continue;
  }
  const scenario = evalScenarioSchema.parse(raw);

  const brief = buildEvalProjectBrief(scenario);
  const context = buildEvalGenerationContext(scenario);
  const prompt = buildEstimateDraftPrompt({ projectBrief: brief, context });
  const lifecycle = scoreConfigurationLifecycle(prompt, scenario.expectations);

  if (!lifecycle.passed) {
    const failed = lifecycle.checks.filter((c) => !c.passed).map((c) => c.id);
    throw new Error(`${scenario.id} lifecycle failed: ${failed.join(", ")}`);
  }

  console.log(`OK ${scenario.id}`);
}

console.log("verify-configuration-lifecycle-fixtures: all checks passed");
