import type {
  AgentEditGuidance,
  EditIntent,
  EstimateAgentContext,
  FinancialTarget,
  RecommendedStrategy,
} from "@/features/estimates/lib/estimate-agent-types";

export function deriveRecommendedStrategy(
  intent: EditIntent,
  financialTarget: FinancialTarget | null,
  _context: EstimateAgentContext,
  constraints: AgentEditGuidance["constraints"],
): RecommendedStrategy {
  if (intent === "profitability") {
    return "margin_first";
  }

  if (intent === "scope") {
    return "scope_first";
  }

  if (intent === "realism") {
    return "quantity_correction";
  }

  if (intent === "budget_target" || intent === "budget_adjustment") {
    if (financialTarget) {
      const absChange = Math.abs(financialTarget.changePercent);
      if (absChange > constraints.preferAdditionsWhenTargetGapExceedsPercent) {
        return "scope_first";
      }
      if (absChange > 0) {
        return "cost_driver_adjustment";
      }
    }
    return "mixed";
  }

  return "mixed";
}
