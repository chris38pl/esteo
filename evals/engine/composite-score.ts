import type { EvalMode } from "@evals/engine/types";

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
): { passed: boolean; failReasons: string[] } {
  const failReasons: string[] = [];

  if (!params.schemaPassed) {
    failReasons.push("schema");
  }
  if (!params.leakagePassed) {
    failReasons.push("leakage");
  }
  if (!params.rulePassed) {
    failReasons.push("rules");
  }
  if (
    params.lineItemCount < params.minLineItems ||
    params.lineItemCount > params.maxLineItems
  ) {
    failReasons.push("lineItemCount");
  }

  if (evalMode === "fast") {
    if (params.fastScore < 6) {
      failReasons.push("fastScore");
    }
  } else {
    if (params.overallScore < params.minScore) {
      failReasons.push("overallScore");
    }
    if (
      params.contextAlignment !== null &&
      params.contextAlignment < params.minContextAlignment
    ) {
      failReasons.push("contextAlignment");
    }
    if (
      params.referenceSimilarity !== null &&
      params.referenceSimilarity < params.minReferenceSimilarity
    ) {
      failReasons.push("referenceSimilarity");
    }
  }

  return { passed: failReasons.length === 0, failReasons };
}
