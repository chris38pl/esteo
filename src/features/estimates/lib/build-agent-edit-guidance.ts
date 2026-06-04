import { buildEstimateAgentContext } from "@/features/estimates/lib/build-estimate-agent-context";
import { buildCompactEstimateTree } from "@/features/estimates/lib/build-compact-estimate-tree";
import { detectEditIntent } from "@/features/estimates/lib/detect-edit-intent";
import { deriveRecommendedStrategy } from "@/features/estimates/lib/derive-recommended-strategy";
import {
  DEFAULT_EDIT_CONSTRAINTS,
  type AgentEditGuidance,
  type CompactEstimateTree,
  type EstimateAgentContext,
  type EstimateVersionSnapshot,
} from "@/features/estimates/lib/estimate-agent-types";
import { parseFinancialTarget } from "@/features/estimates/lib/parse-financial-target";
import type { Locale } from "@/lib/locale";

export function buildAgentEditGuidance(
  message: string,
  agentContext: EstimateAgentContext,
  locale: Locale,
): AgentEditGuidance {
  const intent = detectEditIntent(message, locale);
  const financialTarget = parseFinancialTarget(
    message,
    {
      gross: agentContext.summary.totalGross,
      net: agentContext.summary.totalNet,
    },
    intent,
  );
  const constraints = DEFAULT_EDIT_CONSTRAINTS;
  const recommendedStrategy = deriveRecommendedStrategy(
    intent,
    financialTarget,
    agentContext,
    constraints,
  );

  return {
    intent,
    financialTarget,
    recommendedStrategy,
    constraints,
  };
}

export function buildAgentEditInputs(
  snapshot: EstimateVersionSnapshot,
  message: string,
  locale: Locale,
  currency = "PLN",
): {
  agentContext: EstimateAgentContext;
  compactTree: CompactEstimateTree;
  guidance: AgentEditGuidance;
} {
  const agentContext = buildEstimateAgentContext(snapshot, currency);
  const compactTree = buildCompactEstimateTree(snapshot);
  const guidance = buildAgentEditGuidance(message, agentContext, locale);

  return { agentContext, compactTree, guidance };
}
