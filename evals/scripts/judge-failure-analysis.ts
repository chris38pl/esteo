import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { writeJudgeFailureReportForRun } from "@evals/engine/judge-analysis";

const repoRoot = process.cwd();
const resultsRoot = join(repoRoot, "evals", "results");

function resolveRunId(): string {
  const arg = process.argv.find((a) => a.startsWith("--run="));
  if (arg) {
    return arg.slice("--run=".length);
  }

  if (!existsSync(resultsRoot)) {
    throw new Error("No eval results directory found.");
  }

  const runs = readdirSync(resultsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  if (runs.length === 0) {
    throw new Error("No eval runs found.");
  }

  return runs[0]!;
}

const runId = resolveRunId();
const result = writeJudgeFailureReportForRun(repoRoot, runId);

if (!result) {
  console.error(`No summary.json for run ${runId}`);
  process.exit(1);
}

console.log(`Judge failure analysis: evals/results/${runId}/judge-failure-analysis.md (${result.count} scenarios)`);
