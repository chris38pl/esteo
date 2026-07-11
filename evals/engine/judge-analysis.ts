import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { RunSummary, ScenarioResult } from "@evals/engine/types";

export type JudgeFailureRow = {
  result: ScenarioResult;
};

function isFullCoverage(result: ScenarioResult): boolean {
  if (result.coverageTotal === 0) {
    return false;
  }
  return result.coverageMatched >= result.coverageTotal;
}

function formatScore(value: number | null): string {
  return value === null ? "-" : value.toFixed(1);
}

function formatBool(passed: boolean): string {
  return passed ? "PASS" : "FAIL";
}

export function selectJudgeFailureCandidates(
  summary: RunSummary,
  options?: { minOverall?: number },
): JudgeFailureRow[] {
  const minOverall = options?.minOverall ?? 7;
  return Object.values(summary.scenarios)
    .filter(
      (result) =>
        !result.passed &&
        isFullCoverage(result) &&
        result.overallScore >= minOverall,
    )
    .sort((a, b) => a.overallScore - b.overallScore)
    .map((result) => ({ result }));
}

export function writeJudgeFailureReport(
  resultsDir: string,
  summary: RunSummary,
): { path: string; count: number } {
  const rows = selectJudgeFailureCandidates(summary);
  const lines: string[] = [
    "# Judge failure analysis",
    "",
    "Scenarios that **FAIL** with **coverage 100%** and **overall ≥ 7**.",
    "These are the best candidates for judge-threshold or prompt-quality work - rules and coverage are already green.",
    "",
    `Run: \`${summary.runId}\` | Prompt: v${summary.promptVersion}`,
    `Matched scenarios: **${rows.length}**`,
    "",
    "| Scenario | Overall | Schema | Coverage | RefSim | Context | failReasons |",
    "| --- | ---: | --- | --- | ---: | ---: | --- |",
  ];

  if (rows.length === 0) {
    lines.push("| _none_ | | | | | | |");
  } else {
    for (const { result } of rows) {
      lines.push(
        `| ${result.id} | ${result.overallScore.toFixed(1)} | ${formatBool(result.schemaPassed)} | ${result.coverageMatched}/${result.coverageTotal} (${result.coveragePercent}%) | ${formatScore(result.referenceSimilarityScore)} | ${formatScore(result.contextAlignmentScore)} | ${result.failReasons.join(", ") || "-"} |`,
      );
    }
  }

  lines.push("", "## Per-scenario detail", "");

  if (rows.length === 0) {
    lines.push("_No scenarios matched the filter._", "");
  } else {
    for (const { result } of rows) {
      lines.push(`### ${result.id}`, "");
      lines.push(`- **Overall:** ${result.overallScore.toFixed(1)}`);
      lines.push(`- **Schema:** ${formatBool(result.schemaPassed)}`);
      lines.push(
        `- **Coverage:** ${result.coverageMatched}/${result.coverageTotal} (${result.coveragePercent}%)`,
      );
      lines.push(`- **Rules:** ${result.failReasons.includes("rules") ? "FAIL" : "PASS"} (score ${result.ruleScore.toFixed(1)})`);
      lines.push(`- **Reference similarity:** ${formatScore(result.referenceSimilarityScore)}`);
      lines.push(`- **Context alignment:** ${formatScore(result.contextAlignmentScore)}`);
      lines.push(`- **Judge score:** ${formatScore(result.judgeScore)}`);
      lines.push(`- **failReasons:** ${result.failReasons.join(", ") || "-"}`);
      lines.push("");
    }
  }

  lines.push(
    "## Interpretation",
    "",
    "- `referenceSimilarity` / `contextAlignment` below scenario judge thresholds are the usual blockers here.",
    "- `overallScore` blends rules (30%) and judge (70%); a high rules score with low refSim/context still fails Full eval.",
    "- Scenarios with `rules` in failReasons still appear here when coverage is full - fix mustHave/matcher before tuning judge thresholds.",
    "",
  );

  const outPath = join(resultsDir, "judge-failure-analysis.md");
  writeFileSync(outPath, lines.join("\n"), "utf8");
  return { path: outPath, count: rows.length };
}

export function writeJudgeFailureReportForRun(
  repoRoot: string,
  runId: string,
): { path: string; count: number } | null {
  const resultsDir = join(repoRoot, "evals", "results", runId);
  const summaryPath = join(resultsDir, "summary.json");
  if (!existsSync(summaryPath)) {
    return null;
  }
  const summary = JSON.parse(readFileSync(summaryPath, "utf8")) as RunSummary;
  return writeJudgeFailureReport(resultsDir, summary);
}
