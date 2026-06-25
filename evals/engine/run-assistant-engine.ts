import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildAgentEditInputs } from "@/features/estimates/lib/build-agent-edit-guidance";
import type { EstimateVersionSnapshot } from "@/features/estimates/lib/estimate-agent-types";
import { buildAssistantEvalContext } from "@evals/engine/build-eval-context";
import { estimateCostUsd } from "@evals/engine/cost/cost-tracker";
import { generateAssistantPatchForEval } from "@evals/engine/generate-for-assistant-eval";
import { filterScenarios, loadAssistantScenarios } from "@evals/engine/load-scenarios";
import { scoreAssistantPatch } from "@evals/engine/scorers/assistant-scorer";
import { scoreConfigurationLifecycle } from "@evals/engine/scorers/configuration-lifecycle-scorer";
import type { AssistantScenario } from "@evals/engine/schemas/scenario";

export type RunAssistantEngineOptions = {
  repoRoot: string;
  mode?: "quick" | "all";
  id?: string;
};

function formatRunId(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function toVersionSnapshot(scenario: AssistantScenario): EstimateVersionSnapshot {
  return {
    marginPercent: scenario.estimateSnapshot.marginPercent,
    sections: scenario.estimateSnapshot.sections.map((section) => ({
      id: section.id,
      title: section.title,
      sortOrder: section.sortOrder,
      items: section.items.map((item) => ({
        id: item.id,
        name: item.name,
        unit: item.unit ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        sortOrder: item.sortOrder,
      })),
    })),
  };
}

async function runAssistantScenario(scenario: AssistantScenario) {
  const context = buildAssistantEvalContext(scenario);
  const snapshot = toVersionSnapshot(scenario);
  const { agentContext, compactTree, guidance } = buildAgentEditInputs(
    snapshot,
    scenario.userMessage,
    scenario.locale,
  );

  const generation = await generateAssistantPatchForEval({
    userMessage: scenario.userMessage,
    context,
    agentContext,
    guidance,
    compactTree,
  });

  const patchScore = scoreAssistantPatch(generation.patch, scenario);
  const lifecycleScore = scoreConfigurationLifecycle(generation.prompt, {
    mustHave: [],
    mustNotHave: [],
    coverageTerms: [],
    requiredSections: [],
    forbiddenSections: [],
    leakageDomain: "construction",
    maxLeakageTerms: 0,
    minLineItems: 0,
    maxLineItems: 100,
    configurationLifecycle: {
      promptMustContain: scenario.expectations.promptMustContain,
      promptMustNotContain: [],
    },
  });

  const passed = patchScore.passed && lifecycleScore.passed;
  const failReasons: string[] = [];
  if (!patchScore.passed) {
    failReasons.push("assistant patch expectations failed");
  }
  if (!lifecycleScore.passed) {
    failReasons.push("assistant prompt expectations failed");
  }

  const genCost = estimateCostUsd(
    generation.model,
    generation.usage.promptTokens,
    generation.usage.completionTokens,
  );

  return {
    scenario,
    passed,
    failReasons,
    patchScore,
    lifecycleScore,
    generation,
    cost: {
      promptTokens: generation.usage.promptTokens,
      completionTokens: generation.usage.completionTokens,
      totalTokens: generation.usage.totalTokens,
      estimatedCostUsd: Math.round(genCost * 10000) / 10000,
    },
  };
}

export async function runAssistantEngine(options: RunAssistantEngineOptions): Promise<number> {
  const startedAt = new Date();
  const runId = formatRunId(startedAt);
  const quickManifestPath = join(
    options.repoRoot,
    "evals",
    "manifests",
    "assistant-quick-mode.json",
  );

  let quickManifest: { scenarioIds: string[] } = { scenarioIds: [] };
  try {
    const { readFileSync } = await import("node:fs");
    quickManifest = JSON.parse(readFileSync(quickManifestPath, "utf8")) as {
      scenarioIds: string[];
    };
  } catch {
    // optional
  }

  let scenarios = loadAssistantScenarios(options.repoRoot);
  if (options.id) {
    scenarios = scenarios.filter((s) => s.id === options.id);
  } else if (options.mode === "quick" && quickManifest.scenarioIds.length > 0) {
    const set = new Set(quickManifest.scenarioIds);
    scenarios = scenarios.filter((s) => set.has(s.id));
  }

  if (scenarios.length === 0) {
    console.error("No assistant scenarios matched filters.");
    return 1;
  }

  const resultsDir = join(options.repoRoot, "evals", "results", `assistant-${runId}`);
  mkdirSync(resultsDir, { recursive: true });

  let passedCount = 0;
  console.log(`\nAssistant Evaluation Report — ${scenarios.length} scenario(s)\n`);

  for (const scenario of scenarios) {
    console.log(`→ ${scenario.id}`);
    const result = await runAssistantScenario(scenario);
    const status = result.passed ? "PASS" : "FAIL";
    console.log(`  ${status} patch=${result.patchScore.score} lifecycle=${result.lifecycleScore.score}`);
    if (result.failReasons.length > 0) {
      console.log(`  reasons: ${result.failReasons.join("; ")}`);
    }

    const scenarioDir = join(resultsDir, scenario.id);
    mkdirSync(scenarioDir, { recursive: true });
    writeFileSync(join(scenarioDir, "prompt.txt"), result.generation.prompt, "utf8");
    writeFileSync(
      join(scenarioDir, "patch.json"),
      JSON.stringify(result.generation.patch, null, 2),
      "utf8",
    );
    writeFileSync(
      join(scenarioDir, "scores.json"),
      JSON.stringify(
        {
          passed: result.passed,
          failReasons: result.failReasons,
          patchScore: result.patchScore,
          lifecycleScore: result.lifecycleScore,
          cost: result.cost,
        },
        null,
        2,
      ),
      "utf8",
    );

    if (result.passed) {
      passedCount += 1;
    }
  }

  console.log(`\n${passedCount}/${scenarios.length} passed`);
  console.log(`Artifacts: ${resultsDir}`);

  return passedCount === scenarios.length ? 0 : 1;
}
