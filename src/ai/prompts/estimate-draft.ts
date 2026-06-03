import { resolveIndustryAiProfileForPrompt } from "@/ai/config/industry-ai-profiles";
import {
  formatEstimateCompletenessBlock,
  formatEstimationPrinciplesBlock,
  formatIndustryRoleBlock,
  formatOutputRulesBlock,
  formatScopeChecklistBlock,
  formatScopeExpansionRulesBlock,
  formatQuantityDerivationRulesBlock
} from "@/ai/lib/format-industry-profile-blocks";
import type { EstimateGenerationContext } from "@/features/workspaces/lib/load-estimate-generation-context";
import {
  buildWorkspacePromptFromRules,
  formatCompanyContextBlock,
  formatEstimateStructureBlock,
  formatGeneralAiInstructionsBlock,
  formatSectionRulesBlock,
} from "@/features/workspaces/lib/prompt-context";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export interface EstimateDraftPromptInput {
  projectBrief: string;
  context: EstimateGenerationContext;
}

export function buildEstimateDraftPrompt(input: EstimateDraftPromptInput): string {
  const locale: Locale = isLocale(input.context.locale)
    ? input.context.locale
    : "pl";
  const lang = locale === "en" ? "en" : "pl";

  const profile = resolveIndustryAiProfileForPrompt(
    input.context.industry,
    locale,
  );

  const estimateSections = input.context.estimateSections.map((s) => ({
    title: s.title,
    rule: s.rule,
  }));

  const blocks = [
    formatIndustryRoleBlock(profile.role),
    formatEstimationPrinciplesBlock(profile.estimationPrinciples),
  
    formatCompanyContextBlock(input.context.companyDescription),
    formatGeneralAiInstructionsBlock(input.context.aiInstructions),
  
    `## Project Brief\n${input.projectBrief.trim()}`,
  
    formatScopeChecklistBlock(profile.scopeChecklist),
    formatScopeExpansionRulesBlock(profile.scopeExpansionRules),
    formatQuantityDerivationRulesBlock(profile.quantityDerivationRules),
  
    formatEstimateStructureBlock(estimateSections),
    formatSectionRulesBlock(estimateSections),
  
    buildWorkspacePromptFromRules(input.context.rules),
  
    formatEstimateCompletenessBlock(lang),
    formatOutputRulesBlock(lang),
  ];

  return blocks.filter(Boolean).join("\n\n");
}
