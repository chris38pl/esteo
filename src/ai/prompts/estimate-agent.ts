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
  formatDynamicEstimateStructureBlock,
  formatDynamicSectionNamingRulesBlock,
  formatEstimationPrinciplesBlock,
  formatIndustryRoleBlock,
  formatScopeExpansionRulesBlock,
} from "@/ai/lib/format-industry-profile-blocks";
import { SERVICE_ESTIMATION_PRINCIPLES } from "@/features/estimate-requests/config/industry-experience-config";
import type {
  AgentEditGuidance,
  CompactEstimateTree,
  EstimateAgentContext,
  EstimateVersionSnapshot,
} from "@/features/estimates/lib/estimate-agent-types";
import type { EstimateGenerationContext } from "@/features/workspaces/lib/load-estimate-generation-context";
import {
  buildWorkspacePromptFromRules,
  formatBusinessTypeBlock,
  formatCompanyContextBlock,
  formatEstimateStructureBlock,
  formatGeneralAiInstructionsBlock,
  formatSectionRulesBlock,
} from "@/features/workspaces/lib/prompt-context";
import { isServiceWorkspace } from "@/features/workspaces/lib/industries";
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

function buildServicesAgentContextBlock(context: EstimateGenerationContext): string {
  const estimateSections = context.estimateSections.map((s) => ({
    title: s.title,
    rule: s.rule,
  }));
  const lang = context.locale === "en" ? "en" : "pl";
  const isDynamicStructure = context.sectionStructureMode === "ai_dynamic";

  return [
    formatCompanyContextBlock(context.companyDescription),
    formatGeneralAiInstructionsBlock(context.aiInstructions),
    buildWorkspacePromptFromRules(context.rules),
    isDynamicStructure
      ? formatDynamicEstimateStructureBlock(lang)
      : formatEstimateStructureBlock(estimateSections),
    isDynamicStructure ? null : formatSectionRulesBlock(estimateSections),
    isDynamicStructure ? formatDynamicSectionNamingRulesBlock(lang) : null,
    formatBusinessTypeBlock(context.industryOtherText),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildEstimateAgentPrompt(input: EstimateAgentPromptInput): string {
  const locale: Locale = isLocale(input.context.locale)
    ? input.context.locale
    : "pl";

  const isServices = isServiceWorkspace(input.context.industry);

  const contextBlock = isServices
    ? buildServicesAgentContextBlock(input.context)
    : buildWorkspacePromptContextForConstruction(input.context);

  const industryBlock = isServices
    ? formatEstimationPrinciplesBlock(SERVICE_ESTIMATION_PRINCIPLES[locale])
    : [
        formatIndustryRoleBlock(
          resolveIndustryAiProfileForPrompt(input.context.industry, locale).role,
        ),
        formatScopeExpansionRulesBlock(
          resolveIndustryAiProfileForPrompt(input.context.industry, locale)
            .scopeExpansionRules,
        ),
      ]
        .filter(Boolean)
        .join("\n\n");

  const blocks = [
    `## Response locale\nUser interface locale: ${locale === "pl" ? "Polish (pl)" : "English (en)"}. All reasoning and labels must match this locale.`,
    industryBlock,
    contextBlock,
    input.context.templatePromptBlock,
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

function buildWorkspacePromptContextForConstruction(
  context: EstimateGenerationContext,
): string {
  return [
    formatCompanyContextBlock(context.companyDescription),
    formatGeneralAiInstructionsBlock(context.aiInstructions),
    formatEstimateStructureBlock(context.estimateSections),
    formatSectionRulesBlock(context.estimateSections),
    buildWorkspacePromptFromRules(context.rules),
  ]
    .filter(Boolean)
    .join("\n\n");
}
