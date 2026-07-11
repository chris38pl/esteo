import type { EvalMode, EvalPassClassification } from "@evals/engine/types";

export function computeOverallScore(
  ruleScore: number,
  judgeScore: number | null,
  caps: {
    schemaFailed: boolean;
    mustNotFailed: boolean;
    forbiddenSectionsFailed: boolean;
    leakageFailed: boolean;
  },
): number {
  if (caps.schemaFailed) {
    return 0;
  }

  let score =
    judgeScore !== null ? ruleScore * 0.3 + judgeScore * 0.7 : ruleScore;

  if (caps.mustNotFailed || caps.forbiddenSectionsFailed) {
    score = Math.min(score, 5);
  }
  if (caps.leakageFailed) {
    score = Math.min(score, 4);
  }

  return Math.round(score * 10) / 10;
}

export type DeterminePassedResult = {
  classification: EvalPassClassification;
  /** Strict pass - all gates including referenceSimilarity. */
  passed: boolean;
  /** Release gate - schema, rules, coverage, leakage, judge overall/context; excludes refSim. */
  correctnessPassed: boolean;
  failReasons: string[];
  correctnessFailReasons: string[];
  qualityFailReasons: string[];
};

export function formatPassClassification(
  classification: EvalPassClassification,
  style: "report" | "technical" = "report",
): string {
  if (style === "technical") {
    switch (classification) {
      case "PASS":
        return "[PASS]";
      case "PASS_WITH_LOW_REFSIM":
        return "[PASS_WITH_LOW_REFSIM]";
      case "FAIL":
        return "[FAIL]";
    }
  }

  switch (classification) {
    case "PASS":
      return "[PASS]";
    case "PASS_WITH_LOW_REFSIM":
      return "[PASS (quality warning)]";
    case "FAIL":
      return "[FAIL]";
  }
}

export function formatGateSummaryLines(summary: {
  total: number;
  correctnessPassed: number;
  passed: number;
  passedWithLowRefSim: number;
  failed: number;
  qualityKpis?: {
    averageReferenceSimilarity: number | null;
    averageJudgeScore: number | null;
    averageContextAlignment: number | null;
    goldenAverageReferenceSimilarity: number | null;
  } | null;
}): string[] {
  const lines: string[] = [
    "── Correctness Gate ──",
    `${summary.correctnessPassed} / ${summary.total}`,
    "",
    "── Quality ──",
  ];

  const padCount = (label: string, count: number) =>
    `${label.padEnd(28, ".")}${count}`;

  lines.push(padCount("PASS", summary.passed));
  lines.push(padCount("PASS (quality warning)", summary.passedWithLowRefSim));
  lines.push(padCount("FAIL", summary.failed));

  if (summary.qualityKpis) {
    const kpi = summary.qualityKpis;
    lines.push("", "── Quality KPIs ──");
    if (kpi.averageReferenceSimilarity !== null) {
      lines.push(`Average RefSim:  ${kpi.averageReferenceSimilarity}`);
    }
    if (kpi.averageJudgeScore !== null) {
      lines.push(`Average Judge:   ${kpi.averageJudgeScore}`);
    }
    if (kpi.averageContextAlignment !== null) {
      lines.push(`Average Context: ${kpi.averageContextAlignment}`);
    }
    if (kpi.goldenAverageReferenceSimilarity !== null) {
      lines.push(`Golden RefSim:   ${kpi.goldenAverageReferenceSimilarity}`);
    }
  }

  return lines;
}

export function determinePassed(
  evalMode: EvalMode,
  params: {
    schemaPassed: boolean;
    leakagePassed: boolean;
    rulePassed: boolean;
    fastScore: number;
    overallScore: number;
    judgeScore: number | null;
    contextAlignment: number | null;
    referenceSimilarity: number | null;
    minScore: number;
    minContextAlignment: number;
    minReferenceSimilarity: number;
    lineItemCount: number;
    minLineItems: number;
    maxLineItems: number;
  },
): DeterminePassedResult {
  const correctnessFailReasons: string[] = [];
  const qualityFailReasons: string[] = [];

  if (!params.schemaPassed) {
    correctnessFailReasons.push("schema");
  }
  if (!params.leakagePassed) {
    correctnessFailReasons.push("leakage");
  }
  if (!params.rulePassed) {
    correctnessFailReasons.push("rules");
  }
  if (
    params.lineItemCount < params.minLineItems ||
    params.lineItemCount > params.maxLineItems
  ) {
    correctnessFailReasons.push("lineItemCount");
  }

  if (evalMode === "fast") {
    if (params.fastScore < 6) {
      correctnessFailReasons.push("fastScore");
    }
  } else {
    if (params.overallScore < params.minScore) {
      correctnessFailReasons.push("overallScore");
    }
    if (
      params.contextAlignment !== null &&
      params.contextAlignment < params.minContextAlignment
    ) {
      correctnessFailReasons.push("contextAlignment");
    }
    if (
      params.referenceSimilarity !== null &&
      params.referenceSimilarity < params.minReferenceSimilarity
    ) {
      qualityFailReasons.push("referenceSimilarity");
    }
  }

  const classification: EvalPassClassification =
    correctnessFailReasons.length > 0
      ? "FAIL"
      : qualityFailReasons.length > 0
        ? "PASS_WITH_LOW_REFSIM"
        : "PASS";

  return {
    classification,
    passed: classification === "PASS",
    correctnessPassed: classification !== "FAIL",
    failReasons: [...correctnessFailReasons, ...qualityFailReasons],
    correctnessFailReasons,
    qualityFailReasons,
  };
}
