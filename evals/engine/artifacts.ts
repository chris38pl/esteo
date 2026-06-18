import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { EvalContextSnapshot } from "@evals/engine/build-eval-context";
import type { EvalScenario } from "@evals/engine/schemas/scenario";
import type { ScenarioResult, StabilityResult } from "@evals/engine/types";

export function writeScenarioArtifacts(
  resultsDir: string,
  scenario: EvalScenario,
  data: {
    context: EvalContextSnapshot;
    prompt: string;
    promptMeta: ScenarioResult["promptMeta"];
    requestPayload: unknown;
    generatedEstimate: ScenarioResult["generatedEstimate"];
    rawResponse: string;
    referenceEstimate: unknown;
    schemaScore: unknown;
    ruleScore: unknown;
    coverageScore: unknown;
    leakageScore: unknown;
    lengthMetrics: unknown;
    cost: unknown;
    judgeResult: unknown;
    finalScore: unknown;
    stability?: StabilityResult;
  },
): void {
  const dir = join(resultsDir, scenario.id);
  mkdirSync(dir, { recursive: true });

  writeFileSync(join(dir, "scenario.json"), JSON.stringify(scenario, null, 2), "utf8");
  writeFileSync(join(dir, "context.json"), JSON.stringify(data.context, null, 2), "utf8");
  writeFileSync(join(dir, "prompt.txt"), data.prompt, "utf8");
  writeFileSync(join(dir, "prompt-meta.json"), JSON.stringify(data.promptMeta, null, 2), "utf8");
  writeFileSync(
    join(dir, "request-payload.json"),
    JSON.stringify(data.requestPayload, null, 2),
    "utf8",
  );
  writeFileSync(
    join(dir, "generated-estimate.json"),
    JSON.stringify(data.generatedEstimate, null, 2),
    "utf8",
  );
  writeFileSync(join(dir, "raw-response.txt"), data.rawResponse, "utf8");
  if (data.referenceEstimate) {
    writeFileSync(
      join(dir, "reference-estimate.json"),
      JSON.stringify(data.referenceEstimate, null, 2),
      "utf8",
    );
  }
  writeFileSync(join(dir, "schema-score.json"), JSON.stringify(data.schemaScore, null, 2), "utf8");
  writeFileSync(join(dir, "rule-score.json"), JSON.stringify(data.ruleScore, null, 2), "utf8");
  writeFileSync(
    join(dir, "coverage-score.json"),
    JSON.stringify(data.coverageScore, null, 2),
    "utf8",
  );
  writeFileSync(
    join(dir, "leakage-score.json"),
    JSON.stringify(data.leakageScore, null, 2),
    "utf8",
  );
  writeFileSync(
    join(dir, "length-metrics.json"),
    JSON.stringify(data.lengthMetrics, null, 2),
    "utf8",
  );
  writeFileSync(join(dir, "cost.json"), JSON.stringify(data.cost, null, 2), "utf8");
  if (data.judgeResult) {
    writeFileSync(
      join(dir, "judge-result.json"),
      JSON.stringify(data.judgeResult, null, 2),
      "utf8",
    );
  }
  writeFileSync(join(dir, "final-score.json"), JSON.stringify(data.finalScore, null, 2), "utf8");
  if (data.stability) {
    writeFileSync(join(dir, "stability.json"), JSON.stringify(data.stability, null, 2), "utf8");
  }
}
