import { resolveIndustryAiProfileForPrompt } from "@/ai/config/industry-ai-profiles";
import {
  formatEstimateCompletenessBlock,
  formatEstimationPrinciplesBlock,
  formatIndustryRoleBlock,
  formatOutputRulesBlock,
  formatScopeChecklistBlock,
  formatScopeExpansionRulesBlock,
  formatQuantityDerivationRulesBlock,
  formatComplexityDerivationRulesBlock,
  formatServiceEstimateCompletenessBlock,
  formatServiceOutputRulesBlock,
} from "@/ai/lib/format-industry-profile-blocks";
import { SERVICE_ESTIMATION_PRINCIPLES } from "@/features/estimate-requests/config/industry-experience-config";
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

/** Bump when prompt blocks, role, or output rules change (eval harness tracks this). */
export const ESTIMATE_PROMPT_VERSION = "1.3.1";

export interface EstimateDraftPromptInput {
  projectBrief: string;
  context: EstimateGenerationContext;
}

export function buildEstimateDraftPrompt(input: EstimateDraftPromptInput): string {
  const locale: Locale = isLocale(input.context.locale)
    ? input.context.locale
    : "pl";
  const lang = locale === "en" ? "en" : "pl";

  const estimateSections = input.context.estimateSections.map((s) => ({
    title: s.title,
    rule: s.rule,
  }));

  if (isServiceWorkspace(input.context.industry)) {
    const servicePrinciples = SERVICE_ESTIMATION_PRINCIPLES[locale];
    const blocks = [
      `## Response locale\nUser interface locale: ${locale === "pl" ? "Polish (pl)" : "English (en)"}. All section titles and line item names must match this locale.`,
      formatCompanyContextBlock(input.context.companyDescription),
      formatGeneralAiInstructionsBlock(input.context.aiInstructions),
      buildWorkspacePromptFromRules(input.context.rules),
      formatEstimateStructureBlock(estimateSections),
      formatSectionRulesBlock(estimateSections),
      formatBusinessTypeBlock(input.context.industryOtherText),
      `## Project Brief\n${input.projectBrief.trim()}`,
      formatEstimationPrinciplesBlock(servicePrinciples),
      formatServiceEstimateCompletenessBlock(lang),
      formatServiceOutputRulesBlock(lang),
    ];

    return blocks.filter(Boolean).join("\n\n");
  }

  const profile = resolveIndustryAiProfileForPrompt(
    input.context.industry,
    locale,
  );

  const blocks = [
    `## Response locale\nUser interface locale: ${locale === "pl" ? "Polish (pl)" : "English (en)"}. All section titles and line item names must match this locale.`,
    formatIndustryRoleBlock(profile.role),
    formatEstimationPrinciplesBlock(profile.estimationPrinciples),
    formatCompanyContextBlock(input.context.companyDescription),
    formatGeneralAiInstructionsBlock(input.context.aiInstructions),
    `## Project Brief\n${input.projectBrief.trim()}`,
    formatScopeChecklistBlock(profile.scopeChecklist),
    formatScopeExpansionRulesBlock(profile.scopeExpansionRules),
    ...(profile.quantityDerivationRules?.length
      ? [formatQuantityDerivationRulesBlock(profile.quantityDerivationRules)]
      : []),
    ...(profile.complexityDerivationRules?.length
      ? [formatComplexityDerivationRulesBlock(profile.complexityDerivationRules)]
      : []),
    formatEstimateStructureBlock(estimateSections),
    formatSectionRulesBlock(estimateSections),
    buildWorkspacePromptFromRules(input.context.rules),
    `## Industry Profile Version\n${profile.profileVersion}`,
    formatEstimateCompletenessBlock(lang),
    formatOutputRulesBlock(lang),
  ];

  return blocks.filter(Boolean).join("\n\n");
}
