import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ESTIMATE_PROMPT_VERSION } from "@/ai/prompts/estimate-draft";
import { writeScenarioArtifacts } from "@evals/engine/artifacts";
import {
  buildContextSnapshot,
  buildEvalGenerationContext,
} from "@evals/engine/build-eval-context";
import { buildEvalProjectBrief } from "@evals/engine/build-eval-brief";
import {
  GOLDEN_CANONICAL,
  loadBaselinePrompt,
  loadBaselineSnapshot,
  saveBaseline,
} from "@evals/engine/baseline/baseline";
import { formatPromptDiff } from "@evals/engine/baseline/prompt-diff";
import { computeOverallScore, determinePassed } from "@evals/engine/composite-score";
import { estimateCostUsd } from "@evals/engine/cost/cost-tracker";
import { hashPrompt, measurePromptComplexity } from "@evals/engine/cost/prompt-complexity";
import { generateEstimateForEval } from "@evals/engine/generate-for-eval";
import { runLlmJudge } from "@evals/engine/judge/llm-judge";
import { filterScenarios, loadServicesScenarios } from "@evals/engine/load-scenarios";
import {
  buildRunSummary,
  printCompareReport,
  printEvalReport,
} from "@evals/engine/report";
import type { EvalScenario } from "@evals/engine/schemas/scenario";
import { scoreCoverage } from "@evals/engine/scorers/coverage-scorer";
import { scoreDomainLeakage } from "@evals/engine/scorers/domain-leakage-scorer";
import { measureLength } from "@evals/engine/scorers/length-benchmark";
import { scoreRules } from "@evals/engine/scorers/rule-scorer";
import { scoreSchema } from "@evals/engine/scorers/schema-scorer";
import { STABILITY_RUNS, STABILITY_VARIANCE_THRESHOLD } from "@evals/engine/config/stability";
import type { EvalMode, ScenarioResult } from "@evals/engine/types";

export type RunEngineOptions = {
  repoRoot: string;
  evalMode: EvalMode;
  mode?: "quick" | "all";
  id?: string;
  category?: string;
  locale?: "pl" | "en" | "all";
  baseline?: boolean;
  compare?: boolean;
  comparePath?: string;
  stability?: boolean;
};

function getGitSha(repoRoot: string): string | null {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

function formatRunId(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

async function runScenarioOnce(
  scenario: EvalScenario,
  evalMode: EvalMode,
): Promise<{
  result: ScenarioResult;
  prompt: string;
  context: ReturnType<typeof buildContextSnapshot>;
  artifacts: Parameters<typeof writeScenarioArtifacts>[2];
}> {
  const projectBrief = buildEvalProjectBrief(scenario);
  const context = buildEvalGenerationContext(scenario);
  const contextSnapshot = buildContextSnapshot(scenario, projectBrief);

  const generation = await generateEstimateForEval({
    projectBrief,
    context,
  });

  const complexity = measurePromptComplexity(generation.prompt);
  const promptMeta = {
    promptVersion: ESTIMATE_PROMPT_VERSION,
    promptHash: hashPrompt(generation.prompt),
    ...complexity,
  };

  const schemaScore = scoreSchema(generation.object);
  const ruleScore = schemaScore.passed
    ? scoreRules(generation.object, scenario.expectations)
    : { score: 0, passed: false, checks: [] };

  const leakageScore = schemaScore.passed
    ? scoreDomainLeakage(
        generation.object,
        scenario.expectations.leakageDomain,
        scenario.expectations.maxLeakageTerms,
      )
    : { score: 0, detectedTerms: [], passed: false, domain: scenario.expectations.leakageDomain };

  const coverageScore = schemaScore.passed
    ? scoreCoverage(generation.object, scenario.expectations.coverageTerms)
    : { matched: 0, total: scenario.expectations.coverageTerms.length, percent: 0, matchedTerms: [], missedTerms: scenario.expectations.coverageTerms };

  const lengthMetrics = measureLength(
    generation.object,
    generation.usage.completionTokens,
  );

  let judgeScore: number | null = null;
  let contextAlignment: number | null = null;
  let referenceSimilarity: number | null = null;
  let judgeResult: Awaited<ReturnType<typeof runLlmJudge>> | null = null;

  if (evalMode === "full" && schemaScore.passed && scenario.expectations.judge) {
    judgeResult = await runLlmJudge(scenario, contextSnapshot, generation.object);
    judgeScore = judgeResult.result.score;
    contextAlignment = judgeResult.result.contextAlignment;
    referenceSimilarity = judgeResult.result.referenceSimilarity;
  }

  const mustNotFailed = ruleScore.checks.some(
    (c) => c.id.startsWith("mustNotHave:") && !c.passed,
  );
  const forbiddenFailed = ruleScore.checks.some(
    (c) => c.id.startsWith("forbiddenSection:") && !c.passed,
  );

  const overallScore = computeOverallScore(ruleScore.score, judgeScore, {
    schemaFailed: !schemaScore.passed,
    mustNotFailed,
    forbiddenSectionsFailed: forbiddenFailed,
    leakageFailed: !leakageScore.passed,
  });

  const fastScore = ruleScore.score;
  const judgeConfig = scenario.expectations.judge;

  const { passed, failReasons } = determinePassed(evalMode, {
    schemaPassed: schemaScore.passed,
    leakagePassed: leakageScore.passed,
    rulePassed: ruleScore.passed,
    fastScore,
    overallScore,
    judgeScore,
    contextAlignment,
    referenceSimilarity,
    minScore: judgeConfig?.minScore ?? 7,
    minContextAlignment: judgeConfig?.minContextAlignment ?? 7,
    minReferenceSimilarity: judgeConfig?.minReferenceSimilarity ?? 7,
    lineItemCount: lengthMetrics.lineItemCount,
    minLineItems: scenario.expectations.minLineItems,
    maxLineItems: scenario.expectations.maxLineItems,
  });

  const genCost = estimateCostUsd(
    generation.model,
    generation.usage.promptTokens,
    generation.usage.completionTokens,
  );
  const judgeCost = judgeResult?.estimatedCostUsd ?? 0;

  const cost = {
    promptTokens: generation.usage.promptTokens,
    completionTokens: generation.usage.completionTokens,
    totalTokens: generation.usage.totalTokens,
    judgePromptTokens: judgeResult?.usage.promptTokens,
    judgeCompletionTokens: judgeResult?.usage.completionTokens,
    estimatedCostUsd: Math.round((genCost + judgeCost) * 10000) / 10000,
  };

  const result: ScenarioResult = {
    id: scenario.id,
    name: scenario.name,
    category: scenario.category,
    critical: scenario.critical,
    evalMode,
    schemaPassed: schemaScore.passed,
    fastScore,
    overallScore,
    ruleScore: ruleScore.score,
    judgeScore,
    contextAlignmentScore: contextAlignment,
    referenceSimilarityScore: referenceSimilarity,
    coveragePercent: coverageScore.percent,
    coverageMatched: coverageScore.matched,
    coverageTotal: coverageScore.total,
    leakageScore: leakageScore.score,
    leakagePassed: leakageScore.passed,
    leakageTerms: leakageScore.detectedTerms,
    length: lengthMetrics,
    cost,
    promptMeta,
    passed,
    failReasons,
    generatedEstimate: generation.object,
  };

  const artifacts = {
    context: contextSnapshot,
    prompt: generation.prompt,
    promptMeta,
    requestPayload: scenario.request,
    generatedEstimate: generation.object,
    rawResponse: generation.rawResponse,
    referenceEstimate: scenario.referenceEstimate ?? null,
    schemaScore,
    ruleScore,
    coverageScore,
    leakageScore,
    lengthMetrics,
    cost,
    judgeResult: judgeResult?.result ?? null,
    finalScore: {
      fastScore,
      overallScore,
      passed,
      failReasons,
    },
  };

  return { result, prompt: generation.prompt, context: contextSnapshot, artifacts };
}

async function runScenarioWithStability(
  scenario: EvalScenario,
  evalMode: EvalMode,
): Promise<{
  result: ScenarioResult;
  prompt: string;
  artifacts: Parameters<typeof writeScenarioArtifacts>[2];
  stability: {
    runs: number;
    scores: number[];
    contextAlignments: number[];
    scoreVariance: number;
    contextVariance: number;
    passed: boolean;
  };
}> {
  const runs: ScenarioResult[] = [];
  let lastPrompt = "";
  let lastArtifacts: Parameters<typeof writeScenarioArtifacts>[2] | null = null;

  for (let i = 0; i < STABILITY_RUNS; i++) {
    const run = await runScenarioOnce(scenario, evalMode);
    runs.push(run.result);
    lastPrompt = run.prompt;
    lastArtifacts = run.artifacts;
  }

  const scores = runs.map((r) => r.overallScore);
  const contextAlignments = runs
    .map((r) => r.contextAlignmentScore)
    .filter((v): v is number => v !== null);

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const m = mean(arr);
    return Math.round((arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length) * 100) / 100;
  };

  const scoreVariance = variance(scores);
  const contextVariance = variance(contextAlignments);

  const stability = {
    runs: STABILITY_RUNS,
    scores,
    contextAlignments,
    scoreVariance,
    contextVariance,
    passed: scoreVariance <= STABILITY_VARIANCE_THRESHOLD,
  };

  const avgResult = runs[runs.length - 1];
  return {
    result: avgResult,
    prompt: lastPrompt,
    artifacts: { ...lastArtifacts!, stability },
    stability,
  };
}

export async function runEvalEngine(options: RunEngineOptions): Promise<number> {
  const startedAt = new Date();
  const runId = formatRunId(startedAt);

  const quickManifest = JSON.parse(
    readFileSync(
      join(options.repoRoot, "evals", "manifests", "services-quick-mode.json"),
      "utf8",
    ),
  ) as { scenarioIds: string[] };

  const stabilityManifest = JSON.parse(
    readFileSync(
      join(options.repoRoot, "evals", "manifests", "services-stability.json"),
      "utf8",
    ),
  ) as { scenarioIds: string[] };

  let scenarios = loadServicesScenarios(options.repoRoot);

  if (options.stability) {
    const set = new Set(stabilityManifest.scenarioIds);
    scenarios = scenarios.filter((s) => set.has(s.id));
    if (options.id) {
      scenarios = scenarios.filter((s) => s.id === options.id);
    }
  } else {
    scenarios = filterScenarios(scenarios, {
      mode: options.mode,
      quickIds: quickManifest.scenarioIds,
      id: options.id,
      category: options.category,
      locale: options.locale,
    });
  }

  if (scenarios.length === 0) {
    console.error("No scenarios matched filters.");
    return 1;
  }

  const evalMode: EvalMode =
    options.evalMode === "fast" || options.mode === "quick" ? "fast" : "full";

  if (options.stability && evalMode !== "full") {
    console.error("--stability requires Full Eval (--full)");
    return 1;
  }

  const resultsDir = join(options.repoRoot, "evals", "results", runId);
  mkdirSync(resultsDir, { recursive: true });

  const scenarioResults: Record<string, ScenarioResult> = {};
  const promptSnapshots: Record<string, string> = {};

  for (const scenario of scenarios) {
    console.log(`\n→ ${scenario.id}`);

    if (options.stability) {
      const { result, prompt, artifacts } = await runScenarioWithStability(
        scenario,
        evalMode,
      );
      scenarioResults[scenario.id] = result;
      if (scenario.critical) {
        promptSnapshots[scenario.id] = prompt;
      }
      writeScenarioArtifacts(resultsDir, scenario, artifacts);
      console.log(
        `  stability variance: ${artifacts.stability?.scoreVariance} ${artifacts.stability?.passed ? "STABLE" : "UNSTABLE"}`,
      );
    } else {
      const { result, prompt, artifacts } = await runScenarioOnce(scenario, evalMode);
      scenarioResults[scenario.id] = result;
      if (scenario.critical) {
        promptSnapshots[scenario.id] = prompt;
      }
      writeScenarioArtifacts(resultsDir, scenario, artifacts);
    }

    const r = scenarioResults[scenario.id];
    const scoreLabel = evalMode === "fast" ? `fast=${r.fastScore}` : `overall=${r.overallScore}`;
    console.log(
      `  ${scoreLabel} coverage=${r.coverageMatched}/${r.coverageTotal} ${r.passed ? "PASS" : "FAIL"}`,
    );
  }

  const summary = buildRunSummary(scenarioResults, {
    runId,
    evalMode,
    promptVersion: ESTIMATE_PROMPT_VERSION,
    gitSha: getGitSha(options.repoRoot),
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
  });

  writeFileSync(join(resultsDir, "summary.json"), JSON.stringify(summary, null, 2), "utf8");

  printEvalReport(summary);
  console.log(`\nResults: evals/results/${runId}/`);

  if (options.baseline) {
    saveBaseline(options.repoRoot, summary, promptSnapshots);
    console.log("\nBaseline saved.");
  }

  if (options.compare) {
    const baseline = loadBaselineSnapshot(options.repoRoot, options.comparePath);
    if (!baseline) {
      console.error("No baseline found for compare.");
      return 1;
    }

    let promptDiffText: string | undefined;
    const baselinePrompt = loadBaselinePrompt(
      options.repoRoot,
      baseline.promptVersion,
      GOLDEN_CANONICAL,
    );
    const currentPrompt = promptSnapshots[GOLDEN_CANONICAL];
    if (baselinePrompt && currentPrompt) {
      promptDiffText = formatPromptDiff(
        baseline.promptVersion,
        ESTIMATE_PROMPT_VERSION,
        GOLDEN_CANONICAL,
        baselinePrompt,
        currentPrompt,
      );
      writeFileSync(join(resultsDir, "prompt-diff.txt"), promptDiffText, "utf8");
    }

    const { exitCode } = printCompareReport(summary, baseline, promptDiffText);
    return exitCode;
  }

  return summary.failed > 0 ? 1 : 0;
}
