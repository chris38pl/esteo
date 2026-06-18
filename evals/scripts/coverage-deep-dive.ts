import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { existsSync, readdirSync } from "node:fs";

import { writeCoverageRootCauseForRun } from "@evals/engine/coverage-analysis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

function findLatestRunId(): string | null {
  const resultsDir = join(repoRoot, "evals", "results");
  if (!existsSync(resultsDir)) {
    return null;
  }
  const runs = readdirSync(resultsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  return runs.at(-1) ?? null;
}

function main() {
  const runArg = process.argv.find((a) => a.startsWith("--run="))?.slice("--run=".length);
  const runId = runArg ?? findLatestRunId();
  if (!runId) {
    console.error("No eval run found in evals/results/");
    process.exit(1);
  }

  const result = writeCoverageRootCauseForRun(repoRoot, runId);
  if (!result) {
    console.error(`Missing summary for run ${runId}`);
    process.exit(1);
  }

  console.log(`Wrote ${result.path} (${result.analyzed} scenarios analyzed)`);
}

main();
