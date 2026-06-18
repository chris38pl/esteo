import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { loadBaselineSnapshot } from "@evals/engine/baseline/baseline";
import type { RunSummary } from "@evals/engine/types";

const REFERENCE_SCENARIO_IDS = [
  "wedding-planner",
  "generic-uslugi",
  "edge-empty-company-context",
  "edge-extremely-long-brief",
];

function scoreOf(s: RunSummary["scenarios"][string], mode: RunSummary["evalMode"]): number {
  return mode === "fast" ? s.fastScore : s.overallScore;
}

function findPreviousRunSummary(
  repoRoot: string,
  currentRunId: string,
): { runId: string; summary: RunSummary } | null {
  const resultsDir = join(repoRoot, "evals", "results");
  if (!existsSync(resultsDir)) {
    return null;
  }

  const runIds = readdirSync(resultsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((id) => id !== currentRunId)
    .sort();

  for (let i = runIds.length - 1; i >= 0; i--) {
    const summaryPath = join(resultsDir, runIds[i]!, "summary.json");
    if (!existsSync(summaryPath)) {
      continue;
    }
    try {
      const summary = JSON.parse(readFileSync(summaryPath, "utf8")) as RunSummary;
      return { runId: runIds[i]!, summary };
    } catch {
      continue;
    }
  }

  const baseline = loadBaselineSnapshot(repoRoot);
  if (baseline?.summary) {
    return { runId: `baseline:${baseline.createdAt}`, summary: baseline.summary };
  }

  return null;
}

function formatScenarioTable(
  rows: Array<{
    id: string;
    before: number;
    after: number;
    delta: number;
    schemaBefore: boolean;
    schemaAfter: boolean;
    passBefore: boolean;
    passAfter: boolean;
  }>,
): string {
  if (rows.length === 0) {
    return "_No scenarios in this section._\n";
  }

  const lines = [
    "| Scenario | Before | After | Delta | Schema (before→after) | Pass (before→after) |",
    "| --- | ---: | ---: | ---: | --- | --- |",
  ];

  for (const row of rows) {
    const deltaStr = row.delta > 0 ? `+${row.delta}` : String(row.delta);
    lines.push(
      `| ${row.id} | ${row.before} | ${row.after} | ${deltaStr} | ${row.schemaBefore ? "✓" : "✗"}→${row.schemaAfter ? "✓" : "✗"} | ${row.passBefore ? "PASS" : "FAIL"}→${row.passAfter ? "PASS" : "FAIL"} |`,
    );
  }

  return `${lines.join("\n")}\n`;
}

export function writeComparisonReport(
  repoRoot: string,
  resultsDir: string,
  current: RunSummary,
): void {
  const previous = findPreviousRunSummary(repoRoot, current.runId);
  const mode = current.evalMode;

  const deltas: Array<{
    id: string;
    before: number;
    after: number;
    delta: number;
    schemaBefore: boolean;
    schemaAfter: boolean;
    passBefore: boolean;
    passAfter: boolean;
    coverageDelta: number | null;
  }> = [];

  for (const [id, afterScenario] of Object.entries(current.scenarios)) {
    const beforeScenario = previous?.summary.scenarios[id];
    const afterScore = scoreOf(afterScenario, mode);
    const beforeScore = beforeScenario ? scoreOf(beforeScenario, mode) : 0;
    deltas.push({
      id,
      before: beforeScore,
      after: afterScore,
      delta: beforeScenario ? afterScore - beforeScore : afterScore,
      schemaBefore: beforeScenario?.schemaPassed ?? false,
      schemaAfter: afterScenario.schemaPassed,
      passBefore: beforeScenario?.passed ?? false,
      passAfter: afterScenario.passed,
      coverageDelta: beforeScenario
        ? afterScenario.coveragePercent - beforeScenario.coveragePercent
        : null,
    });
  }

  const improvements = [...deltas]
    .filter((d) => d.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 10);

  const regressions = [...deltas]
    .filter((d) => d.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 10);

  const unchanged = [...deltas].filter((d) => d.delta === 0).slice(0, 10);

  const coverageChanges = [...deltas]
    .filter((d) => d.coverageDelta !== null && Math.abs(d.coverageDelta) >= 0.1)
    .sort((a, b) => Math.abs(b.coverageDelta ?? 0) - Math.abs(a.coverageDelta ?? 0))
    .slice(0, 15);

  const prevCost = previous?.summary.cost.estimatedCostUsd ?? 0;
  const costDelta = current.cost.estimatedCostUsd - prevCost;

  let promptSection = "";
  if (previous) {
    const versionChanged = previous.summary.promptVersion !== current.promptVersion;
    const hashChanged =
      (previous.summary.promptHash ?? "") !== (current.promptHash ?? "");
    promptSection = [
      `- Version: \`v${previous.summary.promptVersion}\` → \`v${current.promptVersion}\`${versionChanged ? "" : " (unchanged)"}`,
      `- Reference hash (\`${current.promptHashSource}\`): \`${previous.summary.promptHash || "—"}\` → \`${current.promptHash}\``,
    ].join("\n");

    if (!versionChanged && hashChanged) {
      promptSection +=
        "\n- ⚠ **HOTFIX WITHOUT VERSION BUMP** — prompt content changed at same semver.";
    } else if (versionChanged) {
      promptSection += "\n- Expected version bump.";
    }
  } else {
    promptSection = "_No previous run to compare._";
  }

  const referenceRows = REFERENCE_SCENARIO_IDS.map((id) => deltas.find((d) => d.id === id)).filter(
    Boolean,
  ) as typeof deltas;

  const markdown = [
    "# Eval Comparison Report",
    "",
    `Run: \`${current.runId}\` | Prompt: v${current.promptVersion} | Hash: \`${current.promptHash}\``,
    previous
      ? `Compared to: \`${previous.runId}\` | Prompt: v${previous.summary.promptVersion} | Hash: \`${previous.summary.promptHash || "—"}\``
      : "Compared to: _none_",
    "",
    "## Key Scenarios",
    "",
    formatScenarioTable(referenceRows),
    "## Scenario Improvements (top 10)",
    "",
    formatScenarioTable(improvements),
    "## Scenario Regressions (top 10)",
    "",
    formatScenarioTable(regressions),
    "## Scenarios Without Score Change (sample)",
    "",
    formatScenarioTable(unchanged),
    "## Coverage Changes",
    "",
    coverageChanges.length === 0
      ? "_No significant coverage changes._\n"
      : [
          "| Scenario | Coverage before | Coverage after | Delta |",
          "| --- | ---: | ---: | ---: |",
          ...coverageChanges.map((d) => {
            const before = previous!.summary.scenarios[d.id]!;
            const after = current.scenarios[d.id]!;
            const deltaStr =
              (d.coverageDelta ?? 0) > 0
                ? `+${d.coverageDelta}`
                : String(d.coverageDelta ?? 0);
            return `| ${d.id} | ${before.coverageMatched}/${before.coverageTotal} (${before.coveragePercent}%) | ${after.coverageMatched}/${after.coverageTotal} (${after.coveragePercent}%) | ${deltaStr} |`;
          }),
        ].join("\n") + "\n",
    "## Cost Changes",
    "",
    previous
      ? [
          `- Total: $${prevCost.toFixed(2)} → $${current.cost.estimatedCostUsd.toFixed(2)} (${costDelta >= 0 ? "+" : ""}${costDelta.toFixed(2)})`,
          `- Tokens: ${previous.summary.cost.totalTokens.toLocaleString()} → ${current.cost.totalTokens.toLocaleString()}`,
        ].join("\n")
      : `_Current run cost: $${current.cost.estimatedCostUsd.toFixed(2)}_`,
    "",
    "## Prompt Version Changes",
    "",
    promptSection,
    "",
    "## Aggregates",
    "",
    `- Passed: ${previous ? `${previous.summary.passed}/${previous.summary.passed + previous.summary.failed}` : "—"} → ${current.passed}/${current.passed + current.failed}`,
    `- Business avg: ${previous?.summary.businessAverageScore ?? "—"} → ${current.businessAverageScore}`,
    `- Generic avg: ${previous?.summary.genericAverageScore ?? "—"} → ${current.genericAverageScore}`,
    `- Edge avg: ${previous?.summary.edgeAverageScore ?? "—"} → ${current.edgeAverageScore}`,
    "",
  ].join("\n");

  writeFileSync(join(resultsDir, "comparison-report.md"), markdown, "utf8");
}
