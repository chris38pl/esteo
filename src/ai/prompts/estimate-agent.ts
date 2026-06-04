import { resolveIndustryAiProfileForPrompt } from "@/ai/config/industry-ai-profiles";
import {
  formatCompactEstimateTreeBlock,
  formatEditIntentBlock,
  formatEstimatorDecisionFrameworkBlock,
  formatFinancialConstraintsBlock,
  formatFinancialSnapshotBlock,
  formatFinancialTargetBlock,
  formatIntentSpecificRulesBlock,
  formatLargeChangeNoteBlock,
  formatOutputRulesBlock,
  formatRecommendedStrategyBlock,
} from "@/ai/lib/format-estimate-agent-prompt-blocks";
import {
  formatIndustryRoleBlock,
  formatScopeExpansionRulesBlock,
} from "@/ai/lib/format-industry-profile-blocks";
import type {
  AgentEditGuidance,
  CompactEstimateTree,
  EstimateAgentContext,
  EstimateVersionSnapshot,
} from "@/features/estimates/lib/estimate-agent-types";
import type { EstimateGenerationContext } from "@/features/workspaces/lib/load-estimate-generation-context";
import { buildWorkspacePromptContext } from "@/features/workspaces/lib/prompt-context";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export type { EstimateVersionSnapshot };

export interface EstimateAgentPromptInput {
  userMessage: string;
  context: EstimateGenerationContext;
  agentContext: EstimateAgentContext;
  guidance: AgentEditGuidance;
  compactTree: CompactEstimateTree;
}

export function buildEstimateAgentPrompt(input: EstimateAgentPromptInput): string {
  const locale: Locale = isLocale(input.context.locale)
    ? input.context.locale
    : "pl";

  const profile = resolveIndustryAiProfileForPrompt(
    input.context.industry,
    locale,
  );

  const contextBlock = buildWorkspacePromptContext({
    companyDescription: input.context.companyDescription,
    aiInstructions: input.context.aiInstructions,
    estimateSections: input.context.estimateSections,
    rules: input.context.rules,
  });

  const industryBlock = [
    formatIndustryRoleBlock(profile.role),
    formatScopeExpansionRulesBlock(profile.scopeExpansionRules),
  ]
    .filter(Boolean)
    .join("\n\n");

  const blocks = [
    industryBlock,
    contextBlock,
    formatFinancialSnapshotBlock(input.agentContext),
    formatEditIntentBlock(input.guidance.intent),
    formatFinancialTargetBlock(input.guidance),
    formatRecommendedStrategyBlock(input.guidance),
    formatFinancialConstraintsBlock(input.guidance),
    formatEstimatorDecisionFrameworkBlock(),
    formatIntentSpecificRulesBlock(input.guidance),
    formatLargeChangeNoteBlock(input.guidance),
    formatCompactEstimateTreeBlock(input.compactTree),
    `## User request\n${input.userMessage.trim()}`,
    formatOutputRulesBlock(locale),
  ].filter((block): block is string => Boolean(block));

  return blocks.join("\n\n");
}
