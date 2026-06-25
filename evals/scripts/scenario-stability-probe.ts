import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFiles } from "../../scripts/load-env.mjs";
import { formatPassClassification } from "@evals/engine/composite-score";
import { loadServicesScenarios } from "@evals/engine/load-scenarios";
import { runScenarioOnce } from "@evals/engine/run-engine";
import type { ScenarioResult } from "@evals/engine/types";

loadEnvFiles();

function formatRunId(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

function parseArgs(argv: string[]) {
  const opts = { id: "wedding-planner", runs: 10 };
  for (const arg of argv) {
    if (arg.startsWith("--id=")) {
      opts.id = arg.slice("--id=".length);
    } else if (arg.startsWith("--runs=")) {
      opts.runs = Number.parseInt(arg.slice("--runs=".length), 10);
    }
  }
  return opts;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function metricStats(values: number[]) {
  return {
    values,
    avg: round(mean(values)),
    stddev: round(stddev(values)),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function nullableMetricStats(values: Array<number | null>) {
  const defined = values.filter((value): value is number => value !== null);
  return metricStats(defined);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scenarios = loadServicesScenarios(repoRoot);
  const scenario = scenarios.find((entry) => entry.id === args.id);

  if (!scenario) {
    console.error(`Scenario not found: ${args.id}`);
    process.exit(1);
  }

  if (!Number.isFinite(args.runs) || args.runs < 1) {
    console.error("--runs must be a positive integer");
    process.exit(1);
  }

  console.log(`\nStability probe: ${scenario.id} × ${args.runs} (full + judge)\n`);

  const runs: ScenarioResult[] = [];

  for (let i = 0; i < args.runs; i++) {
    const { result } = await runScenarioOnce(scenario, "full");
    runs.push(result);
    const refSim = result.referenceSimilarityScore ?? "—";
    const judge = result.judgeScore ?? "—";
    const context = result.contextAlignmentScore ?? "—";
    console.log(
      `  run ${String(i + 1).padStart(2, "0")}: overall=${result.overallScore}  refSim=${refSim}  judge=${judge}  context=${context}  ${formatPassClassification(result.classification)}`,
    );
  }

  const overall = metricStats(runs.map((run) => run.overallScore));
  const refSim = nullableMetricStats(runs.map((run) => run.referenceSimilarityScore));
  const judge = nullableMetricStats(runs.map((run) => run.judgeScore));
  const context = nullableMetricStats(runs.map((run) => run.contextAlignmentScore));
  const passCount = runs.filter((run) => run.classification === "PASS").length;
  const lowRefSimCount = runs.filter(
    (run) => run.classification === "PASS_WITH_LOW_REFSIM",
  ).length;
  const failCount = runs.filter((run) => run.classification === "FAIL").length;

  console.log("\n── Summary ──");
  console.log(
    `Overall:  avg ${overall.avg}  σ ${overall.stddev}  min ${overall.min}  max ${overall.max}`,
  );
  console.log(
    `RefSim:   avg ${refSim.avg}  σ ${refSim.stddev}  min ${refSim.min}  max ${refSim.max}`,
  );
  console.log(
    `Judge:    avg ${judge.avg}  σ ${judge.stddev}  min ${judge.min}  max ${judge.max}`,
  );
  console.log(
    `Context:  avg ${context.avg}  σ ${context.stddev}  min ${context.min}  max ${context.max}`,
  );
  console.log(`PASS:                 ${passCount}/${args.runs}`);
  console.log(`PASS (quality warning)....${lowRefSimCount}/${args.runs}`);
  console.log(`FAIL:                 ${failCount}/${args.runs}`);

  const unstableThreshold = 1.0;
  const refSimUnstable = refSim.stddev > unstableThreshold;
  const overallUnstable = overall.stddev > unstableThreshold;
  const verdict =
    refSimUnstable || overallUnstable
      ? "UNSTABLE — high judge variance; track RefSim as quality signal"
      : "STABLE — variance within acceptable range";

  console.log(`\nVerdict: ${verdict}`);

  const startedAt = new Date();
  const runId = formatRunId(startedAt);
  const outDir = join(repoRoot, "evals", "results", "stability-probes");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${scenario.id}-${runId}.json`);

  const payload = {
    scenarioId: scenario.id,
    runs: args.runs,
    startedAt: startedAt.toISOString(),
    passCount,
    passWithLowRefSimCount: lowRefSimCount,
    failCount,
    metrics: { overall, referenceSimilarity: refSim, judge, contextAlignment: context },
    verdict,
    runDetails: runs.map((run, index) => ({
      run: index + 1,
      overallScore: run.overallScore,
      referenceSimilarity: run.referenceSimilarityScore,
      judgeScore: run.judgeScore,
      contextAlignment: run.contextAlignmentScore,
      classification: run.classification,
      passed: run.passed,
      correctnessPassed: run.correctnessPassed,
      failReasons: run.failReasons,
    })),
  };

  writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`\nSaved: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
