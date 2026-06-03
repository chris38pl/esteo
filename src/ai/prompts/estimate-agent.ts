import { resolveIndustryAiProfileForPrompt } from "@/ai/config/industry-ai-profiles";
import {
  formatIndustryRoleBlock,
  formatScopeExpansionRulesBlock,
} from "@/ai/lib/format-industry-profile-blocks";
import type { EstimateGenerationContext } from "@/features/workspaces/lib/load-estimate-generation-context";
import { buildWorkspacePromptContext } from "@/features/workspaces/lib/prompt-context";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export interface EstimateVersionSnapshot {
  marginPercent: number;
  sections: Array<{
    id: string;
    title: string;
    sortOrder: number;
    items: Array<{
      id: string;
      name: string;
      unit?: string | null;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      sortOrder: number;
    }>;
  }>;
}

export interface EstimateAgentPromptInput {
  userMessage: string;
  currentVersion: EstimateVersionSnapshot;
  context: EstimateGenerationContext;
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

  const currentStateBlock = [
    "## Current estimate state",
    `Global margin: ${input.currentVersion.marginPercent}%`,
    "",
    JSON.stringify(input.currentVersion.sections, null, 2),
  ].join("\n");

  const userBlock = `## User request\n${input.userMessage.trim()}`;

  const instrBlock = [
    "## Instructions",
    `- Respond in language: ${locale === "pl" ? "Polish (pl)" : "English (en)"}`,
    "- Return only a patch describing what to change — do NOT return the full estimate.",
    "- Reference existing items by their id when updating or deleting.",
    "- For additions, specify the sectionTitle to add items to (prefer existing section titles from the estimate).",
    "- Apply Scope Expansion Rules when adding work implied by the user request.",
    "- Use empty arrays for additions, updates, deletions, and newSections when there are no changes of that type.",
    "- In each update object, set name/unit/quantity/unitPrice/vatRate to null for fields that must not change.",
    "- Set unit to null on new line items when no unit applies.",
    "- Set marginPercent to null when the global margin should not change.",
    "- Set reasoning to null when no explanation is needed.",
    "- Set vatRate as a decimal fraction (e.g. 0.23 for 23%).",
    "- Do not add artificial line items unrelated to the request.",
  ].join("\n");

  return [industryBlock, contextBlock, currentStateBlock, userBlock, instrBlock]
    .filter(Boolean)
    .join("\n\n");
}
