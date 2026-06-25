import {
  formatGateSummaryLines,
  formatPassClassification,
} from "@evals/engine/composite-score";
import type { BaselineSnapshot } from "@evals/engine/baseline/baseline";
import {
  CRITICAL_REGRESSION_THRESHOLD,
  DEFAULT_REGRESSION_THRESHOLD,
  GOLDEN_REGRESSION_THRESHOLD,
  COST_REGRESSION_RATIO,
  LINE_ITEM_CRITICAL_RATIO,
  LINE_ITEM_REGRESSION_RATIO,
  PROMPT_BLOAT_WORD_RATIO,
} from "@evals/engine/config/regression-thresholds";
import type { RunSummary, ScenarioResult } from "@evals/engine/types";

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export function printEvalReport(summary: RunSummary): void {
  const modeLabel = summary.evalMode === "fast" ? "FAST" : "FULL";
  console.log(`\nServices Evaluation Report [${modeLabel}]`);
  console.log(`Prompt: v${summary.promptVersion} | Run: ${summary.runId}`);
  if (summary.gitSha) {
    console.log(`Git: ${summary.gitSha}`);
  }
  console.log(`Duration: ${Math.round(summary.durationMs / 1000)}s`);
  console.log("");

  const business = Object.values(summary.scenarios).filter((s) => s.category === "business");
  const generic = Object.values(summary.scenarios).filter((s) => s.category === "generic");
  const edge = Object.values(summary.scenarios).filter(
    (s) => s.category === "edge" || s.category === "stress",
  );

  if (business.length > 0) {
    console.log("── Business ──");
    for (const s of business) {
      printScenarioLine(s, summary.evalMode);
    }
    console.log("");
  }

  if (generic.length > 0) {
    console.log("── Generic (fallback) ──");
    for (const s of generic) {
      printScenarioLine(s, summary.evalMode);
    }
    console.log("");
  }

  if (edge.length > 0) {
    console.log("── Edge / Stress ──");
    for (const s of edge) {
      printScenarioLine(s, summary.evalMode);
    }
    console.log("");
  }

  console.log("────────────────────────────────────");
  if (summary.evalMode === "full") {
    console.log(
      `Business Average:   Overall ${summary.businessAverageScore}  |  Context ${summary.businessAverageContextAlignment ?? "—"}  |  Coverage ${summary.businessAverageCoverage}%`,
    );
    console.log(
      `Edge Average:       Overall ${summary.edgeAverageScore}  |  Context ${summary.edgeAverageContextAlignment ?? "—"}  |  Coverage ${summary.edgeAverageCoverage}%`,
    );
    console.log(
      `Generic Average:    Overall ${summary.genericAverageScore}  |  Context ${summary.genericAverageContextAlignment ?? "—"}  |  Coverage ${summary.genericAverageCoverage}%`,
    );
    if (summary.goldenAverageScore !== null) {
      console.log(
        `Golden Average:     Overall ${summary.goldenAverageScore}  |  Context ${summary.goldenAverageContextAlignment ?? "—"}`,
      );
    }
  } else {
    console.log(`Business Average (fast): ${summary.businessAverageScore}`);
    console.log(`Generic Average (fast): ${summary.genericAverageScore}`);
    console.log(`Edge Average (fast): ${summary.edgeAverageScore}`);
  }

  console.log(
    `Length: avg ${summary.lengthBenchmark.avgLineItems} items | ${summary.lengthBenchmark.avgOutputTokens} output tokens`,
  );
  console.log(
    `Prompt complexity: avg ${summary.promptComplexity.avgWords} words | ${summary.promptComplexity.avgSections} sections`,
  );
  console.log(
    `Cost: $${summary.cost.estimatedCostUsd.toFixed(2)} (${summary.cost.promptTokens} prompt + ${summary.cost.completionTokens} completion tokens)`,
  );

  const total = summary.passed + summary.passedWithLowRefSim + summary.failed;
  console.log("");
  for (const line of formatGateSummaryLines({
    total,
    correctnessPassed: summary.correctnessPassed,
    passed: summary.passed,
    passedWithLowRefSim: summary.passedWithLowRefSim,
    failed: summary.failed,
    qualityKpis: summary.qualityKpis,
  })) {
    console.log(line);
  }
}

function printScenarioLine(s: ScenarioResult, mode: RunSummary["evalMode"]): void {
  const star = s.critical ? " ★" : "";
  const status = formatPassClassification(s.classification);
  const coverage =
    s.coverageTotal > 0 ? `coverage: ${s.coverageMatched}/${s.coverageTotal}` : "";
  const leakage = `leakage: ${s.leakageScore}/10`;

  if (mode === "fast") {
    console.log(
      `${s.name}${star}`.padEnd(28) +
        `Fast: ${s.fastScore.toFixed(1)}  ${coverage}  ${leakage}  items: ${s.length.lineItemCount}  ${status}`,
    );
  } else {
    const ctx = s.contextAlignmentScore?.toFixed(1) ?? "—";
    const ref = s.referenceSimilarityScore?.toFixed(1) ?? "—";
    console.log(
      `${s.name}${star}`.padEnd(28) +
        `Overall: ${s.overallScore.toFixed(1)}  Context: ${ctx}  RefSim: ${ref}  ${coverage}  ${status}`,
    );
  }
}

export function printCompareReport(
  current: RunSummary,
  baseline: BaselineSnapshot,
  promptDiffText?: string,
): { exitCode: number } {
  console.log("\nServices Regression Report [FULL]");
  console.log(`Baseline:  Prompt v${baseline.promptVersion}  (${baseline.createdAt})`);
  console.log(`Current:   Prompt v${current.promptVersion}  (${current.startedAt})`);

  if (promptDiffText) {
    console.log("\n── Prompt Changes ──");
    console.log(promptDiffText);
  }

  if (baseline.promptVersion !== current.promptVersion) {
    console.log("\nPrompt version changed — review quality deltas below.");
  }

  const bWords = baseline.summary.promptComplexity.avgWords;
  const cWords = current.promptComplexity.avgWords;
  if (bWords > 0) {
    const wordDelta = ((cWords - bWords) / bWords) * 100;
    console.log("\n── Prompt Complexity ──");
    console.log(
      `v${baseline.promptVersion}  Words: ${bWords.toLocaleString()}  |  Sections: ${baseline.summary.promptComplexity.avgSections}`,
    );
    console.log(
      `v${current.promptVersion}  Words: ${cWords.toLocaleString()}  |  Sections: ${current.promptComplexity.avgSections}`,
    );
    if (wordDelta > (PROMPT_BLOAT_WORD_RATIO - 1) * 100) {
      console.log(`        ⚠ Words +${wordDelta.toFixed(0)}%`);
    }
  }

  console.log("\n── Score Deltas ──");
  let hasCritical = false;
  let hasGoldenCritical = false;

  for (const [id, cur] of Object.entries(current.scenarios)) {
    const base = baseline.summary.scenarios[id];
    if (!base) {
      console.log(`${cur.name}`.padEnd(28) + "NEW");
      continue;
    }

    const delta = cur.overallScore - base.overallScore;
    const threshold = cur.critical ? GOLDEN_REGRESSION_THRESHOLD : DEFAULT_REGRESSION_THRESHOLD;
    let label = "OK";
    if (delta <= CRITICAL_REGRESSION_THRESHOLD) {
      label = "CRITICAL";
      hasCritical = true;
    } else if (delta <= threshold) {
      label = cur.critical ? "CRITICAL REGRESSION" : "WARNING";
      if (cur.critical) {
        hasGoldenCritical = true;
      } else if (delta < DEFAULT_REGRESSION_THRESHOLD) {
        // warning only for non-critical
      }
    }
    if (cur.critical && delta <= GOLDEN_REGRESSION_THRESHOLD) {
      label = "CRITICAL REGRESSION";
      hasGoldenCritical = true;
    }

    const star = cur.critical ? " ★" : "";
    console.log(
      `${cur.name}${star}`.padEnd(28) +
        `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}  (${base.overallScore.toFixed(1)} → ${cur.overallScore.toFixed(1)})  ${label}`,
    );
  }

  const scoreDelta = current.businessAverageScore - baseline.summary.businessAverageScore;
  console.log(`\nBusiness Average`.padEnd(28) + `${scoreDelta >= 0 ? "+" : ""}${scoreDelta.toFixed(1)}`);

  const bItems = baseline.summary.lengthBenchmark.avgLineItems;
  const cItems = current.lengthBenchmark.avgLineItems;
  if (bItems > 0) {
    const ratio = cItems / bItems;
    let bloat = "";
    if (ratio >= LINE_ITEM_CRITICAL_RATIO) {
      bloat = "CRITICAL BLOAT";
    } else if (ratio >= LINE_ITEM_REGRESSION_RATIO) {
      bloat = "WARNING";
    }
    console.log(
      `\nLength: avg line items  ${bItems} → ${cItems}  (${ratio >= 1 ? "+" : ""}${((ratio - 1) * 100).toFixed(0)}%)  ${bloat}`,
    );
  }

  const bCost = baseline.summary.cost.estimatedCostUsd;
  const cCost = current.cost.estimatedCostUsd;
  if (bCost > 0) {
    const costRatio = cCost / bCost;
    console.log("\n── Cost ──");
    console.log(
      `Run total:  $${bCost.toFixed(2)} → $${cCost.toFixed(2)}  (${costRatio >= 1 ? "+" : ""}${((costRatio - 1) * 100).toFixed(0)}%)`,
    );
    if (costRatio >= COST_REGRESSION_RATIO && scoreDelta < 0.5) {
      console.log("Quality vs Cost: marginal quality change may not justify cost increase");
    }
  }

  const total = current.passed + current.passedWithLowRefSim + current.failed;
  const baseTotal =
    (baseline.summary.passed ?? 0) +
    (baseline.summary.passedWithLowRefSim ?? 0) +
    (baseline.summary.failed ?? 0);

  console.log("\n── Correctness Gate ──");
  console.log(
    `Baseline: ${baseline.summary.correctnessPassed ?? baseline.summary.passed}/${baseTotal || total}  →  Current: ${current.correctnessPassed}/${total}`,
  );

  console.log("\n── Quality ──");
  const padDelta = (label: string, before: number, after: number) => {
    console.log(`${label.padEnd(28, ".")}${before} → ${after}`);
  };
  padDelta("PASS", baseline.summary.passed ?? 0, current.passed);
  padDelta("PASS (quality warning)", baseline.summary.passedWithLowRefSim ?? 0, current.passedWithLowRefSim);
  padDelta("FAIL", baseline.summary.failed ?? 0, current.failed);

  if (current.qualityKpis && baseline.summary.qualityKpis) {
    console.log("\n── Quality KPIs ──");
    const b = baseline.summary.qualityKpis;
    const c = current.qualityKpis;
    if (b.averageReferenceSimilarity !== null && c.averageReferenceSimilarity !== null) {
      const delta = c.averageReferenceSimilarity - b.averageReferenceSimilarity;
      console.log(
        `Average RefSim:  ${b.averageReferenceSimilarity} → ${c.averageReferenceSimilarity}  (${delta >= 0 ? "+" : ""}${delta.toFixed(1)})`,
      );
    }
    if (b.averageJudgeScore !== null && c.averageJudgeScore !== null) {
      const delta = c.averageJudgeScore - b.averageJudgeScore;
      console.log(
        `Average Judge:   ${b.averageJudgeScore} → ${c.averageJudgeScore}  (${delta >= 0 ? "+" : ""}${delta.toFixed(1)})`,
      );
    }
    if (b.goldenAverageReferenceSimilarity !== null && c.goldenAverageReferenceSimilarity !== null) {
      const delta = c.goldenAverageReferenceSimilarity - b.goldenAverageReferenceSimilarity;
      console.log(
        `Golden RefSim:   ${b.goldenAverageReferenceSimilarity} → ${c.goldenAverageReferenceSimilarity}  (${delta >= 0 ? "+" : ""}${delta.toFixed(1)})`,
      );
    }
  }

  const exitCode = hasCritical || hasGoldenCritical || current.failed > 0 ? 1 : 0;
  return { exitCode };
}

export function buildRunSummary(
  scenarios: Record<string, ScenarioResult>,
  meta: {
    runId: string;
    evalMode: RunSummary["evalMode"];
    promptVersion: string;
    gitSha: string | null;
    startedAt: string;
    durationMs: number;
  },
): RunSummary {
  const all = Object.values(scenarios);
  const business = all.filter((s) => s.category === "business");
  const generic = all.filter((s) => s.category === "generic");
  const edge = all.filter((s) => s.category === "edge" || s.category === "stress");
  const golden = all.filter((s) => s.critical);

  const businessScores = business.map((s) =>
    meta.evalMode === "fast" ? s.fastScore : s.overallScore,
  );
  const genericScores = generic.map((s) =>
    meta.evalMode === "fast" ? s.fastScore : s.overallScore,
  );
  const edgeScores = edge.map((s) => (meta.evalMode === "fast" ? s.fastScore : s.overallScore));

  const businessCtx = business
    .map((s) => s.contextAlignmentScore)
    .filter((v): v is number => v !== null);
  const genericCtx = generic
    .map((s) => s.contextAlignmentScore)
    .filter((v): v is number => v !== null);
  const edgeCtx = edge
    .map((s) => s.contextAlignmentScore)
    .filter((v): v is number => v !== null);

  const totalCost = all.reduce((sum, s) => sum + s.cost.estimatedCostUsd, 0);
  const promptTokens = all.reduce((sum, s) => sum + s.cost.promptTokens, 0);
  const completionTokens = all.reduce((sum, s) => sum + s.cost.completionTokens, 0);
  const judgeTokens = all.reduce(
    (sum, s) => sum + (s.cost.judgePromptTokens ?? 0) + (s.cost.judgeCompletionTokens ?? 0),
    0,
  );

  const complexities = all.map((s) => s.promptMeta);
  const maxWords = Math.max(...complexities.map((c) => c.promptWords), 0);
  const maxScenario =
    all.find((s) => s.promptMeta.promptWords === maxWords)?.id ?? null;

  const promptHashes: Record<string, string> = {};
  for (const s of all) {
    promptHashes[s.id] = s.promptMeta.promptHash;
  }
  const hashSource = all.find((s) => s.id === "wedding-planner") ?? all[0];
  const promptHash = hashSource?.promptMeta.promptHash ?? "";
  const promptHashSource = hashSource?.id ?? "";

  const refSimScores = all
    .map((s) => s.referenceSimilarityScore)
    .filter((v): v is number => v !== null);
  const judgeScores = all.map((s) => s.judgeScore).filter((v): v is number => v !== null);
  const contextScores = all
    .map((s) => s.contextAlignmentScore)
    .filter((v): v is number => v !== null);
  const goldenRefSim = golden
    .map((s) => s.referenceSimilarityScore)
    .filter((v): v is number => v !== null);

  return {
    runId: meta.runId,
    evalMode: meta.evalMode,
    promptVersion: meta.promptVersion,
    promptHash,
    promptHashSource,
    promptHashes,
    gitSha: meta.gitSha,
    startedAt: meta.startedAt,
    durationMs: meta.durationMs,
    businessAverageScore: avg(businessScores),
    businessAverageContextAlignment:
      meta.evalMode === "full" && businessCtx.length > 0 ? avg(businessCtx) : null,
    businessAverageCoverage: avg(business.map((s) => s.coveragePercent)),
    edgeAverageScore: avg(edgeScores),
    edgeAverageContextAlignment:
      meta.evalMode === "full" && edgeCtx.length > 0 ? avg(edgeCtx) : null,
    edgeAverageCoverage: avg(edge.map((s) => s.coveragePercent)),
    genericAverageScore: avg(genericScores),
    genericAverageContextAlignment:
      meta.evalMode === "full" && genericCtx.length > 0 ? avg(genericCtx) : null,
    genericAverageCoverage: avg(generic.map((s) => s.coveragePercent)),
    goldenAverageScore:
      golden.length > 0
        ? avg(golden.map((s) => (meta.evalMode === "fast" ? s.fastScore : s.overallScore)))
        : null,
    goldenAverageContextAlignment:
      golden.length > 0
        ? avg(
            golden
              .map((s) => s.contextAlignmentScore)
              .filter((v): v is number => v !== null),
          ) || null
        : null,
    passed: all.filter((s) => s.classification === "PASS").length,
    passedWithLowRefSim: all.filter((s) => s.classification === "PASS_WITH_LOW_REFSIM").length,
    failed: all.filter((s) => s.classification === "FAIL").length,
    correctnessPassed: all.filter((s) => s.correctnessPassed).length,
    qualityKpis:
      meta.evalMode === "full"
        ? {
            averageReferenceSimilarity:
              refSimScores.length > 0 ? avg(refSimScores) : null,
            averageJudgeScore: judgeScores.length > 0 ? avg(judgeScores) : null,
            averageContextAlignment:
              contextScores.length > 0 ? avg(contextScores) : null,
            goldenAverageReferenceSimilarity:
              goldenRefSim.length > 0 ? avg(goldenRefSim) : null,
          }
        : null,
    cost: {
      promptTokens,
      completionTokens,
      judgeTokens,
      totalTokens: promptTokens + completionTokens + judgeTokens,
      estimatedCostUsd: Math.round(totalCost * 100) / 100,
    },
    promptComplexity: {
      avgWords: Math.round(avg(complexities.map((c) => c.promptWords))),
      avgCharacters: Math.round(avg(complexities.map((c) => c.promptCharacters))),
      avgSections: Math.round(avg(complexities.map((c) => c.promptSections)) * 10) / 10,
      maxWords,
      maxWordsScenario: maxScenario,
    },
    lengthBenchmark: {
      avgLineItems: Math.round(avg(all.map((s) => s.length.lineItemCount)) * 10) / 10,
      avgSectionCount: Math.round(avg(all.map((s) => s.length.sectionCount)) * 10) / 10,
      avgOutputTokens: Math.round(avg(all.map((s) => s.length.outputTokens))),
    },
    scenarios,
  };
}

export function buildGateSummaryMarkdown(summary: RunSummary): string {
  const total = summary.passed + summary.passedWithLowRefSim + summary.failed;
  const body = formatGateSummaryLines({
    total,
    correctnessPassed: summary.correctnessPassed,
    passed: summary.passed,
    passedWithLowRefSim: summary.passedWithLowRefSim,
    failed: summary.failed,
    qualityKpis: summary.qualityKpis,
  });

  return [
    "# Eval Gate Summary",
    "",
    `Run: \`${summary.runId}\` | Prompt: v${summary.promptVersion}`,
    "",
    ...body.map((line) => {
      if (line.startsWith("──")) {
        return `## ${line.replace(/──/g, "").trim()}`;
      }
      if (line === "") {
        return "";
      }
      if (line.includes(".") && !line.startsWith("Average") && !line.startsWith("Golden")) {
        return `- ${line}`;
      }
      return line;
    }),
    "",
  ].join("\n");
}
