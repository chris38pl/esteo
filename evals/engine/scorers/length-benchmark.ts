import type { EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";
import type { LengthMetrics } from "@evals/engine/types";

export function measureLength(
  output: EstimateDraftOutput,
  outputTokens = 0,
): LengthMetrics {
  const sectionCount = output.sections.length;
  const lineItemCount = output.sections.reduce((sum, s) => sum + s.items.length, 0);
  return {
    sectionCount,
    lineItemCount,
    outputTokens,
    avgItemsPerSection:
      sectionCount > 0 ? Math.round((lineItemCount / sectionCount) * 10) / 10 : 0,
  };
}
