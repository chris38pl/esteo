import { resolveIndustryAiProfileForPrompt } from "@/ai/config/industry-ai-profiles";
import { formatIndustryRoleBlock } from "@/ai/lib/format-industry-profile-blocks";
import {
  formatBusinessTypeBlock,
  formatCompanyContextBlock,
  formatGeneralAiInstructionsBlock,
} from "@/features/workspaces/lib/prompt-context";
import { isServiceWorkspace } from "@/features/workspaces/lib/industries";
import type { WorkspaceIndustry } from "@prisma/client";
import type { Locale } from "@/lib/locale";

export const TEMPLATE_GENERATION_PROMPT_VERSION = "1.1.0";

export type TemplateGenerationMode = "enhance" | "faithful";

export interface TemplateGenerationPromptInput {
  userOutline: string;
  locale: Locale;
  industry: WorkspaceIndustry;
  industryOtherText: string | null;
  companyDescription: string | null;
  aiInstructions: string | null;
  generationMode: TemplateGenerationMode;
}

function formatCompanyStyleBlock(
  companyDescription: string | null,
  aiInstructions: string | null,
): string {
  const company = formatCompanyContextBlock(companyDescription);
  const instructions = formatGeneralAiInstructionsBlock(aiInstructions);

  if (!company && !instructions) {
    return "";
  }

  const lines = [
    "## Company style",
    "Adapt section titles, line item names, and tone to match how this company works.",
    "Use company context and AI instructions below - avoid generic buckets like \"Usługi\", \"Opcje\", or \"Uwagi\" when a more specific professional structure fits.",
    company,
    instructions,
  ].filter(Boolean);

  return lines.join("\n");
}

function formatGenerationModeBlock(mode: TemplateGenerationMode): string {
  if (mode === "faithful") {
    return [
      "## Generation mode: faithful",
      "Stay close to the user's outline.",
      "Preserve their section titles and item names.",
      "Only add minimal missing items when clearly required for a usable template.",
      "Do not invent large new sections unrelated to the outline.",
    ].join("\n");
  }

  return [
    "## Generation mode: enhance",
    "Preserve the user's core structure and wording.",
    "You may add missing sections or line items that are obvious for a professional estimate template in this industry and company style.",
    "Do not duplicate items the user already listed.",
    "Goal: a useful reusable template, not a literal transcript.",
  ].join("\n");
}

function formatOutputRulesBlock(locale: Locale): string {
  const lang = locale === "pl" ? "Polish (pl)" : "English (en)";
  return [
    "## Output rules",
    `All section titles and item names must be in ${lang}.`,
    "Return JSON only - no prices, quantities, or VAT.",
    "Maximum 20 sections, maximum 20 items per section, maximum 200 items total.",
    "Use sortOrder starting at 0 within sections and items.",
    "Set unit to null when not obvious; use kpl, m², h, szt. when clear from context.",
    "Section guidance: short optional hints only when helpful.",
  ].join("\n");
}

export function buildTemplateGenerationPrompt(input: TemplateGenerationPromptInput): string {
  const profile = resolveIndustryAiProfileForPrompt(input.industry, input.locale);
  const localeLabel =
    input.locale === "pl" ? "Polish (pl)" : "English (en)";

  const industryBlock = [
    formatIndustryRoleBlock(profile.role),
    isServiceWorkspace(input.industry)
      ? formatBusinessTypeBlock(input.industryOtherText)
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const blocks = [
    `## Response locale\nUser interface locale: ${localeLabel}. All template names, section titles, and item names must match this locale.`,
    industryBlock,
    formatCompanyStyleBlock(input.companyDescription, input.aiInstructions),
    formatGenerationModeBlock(input.generationMode),
    [
      "## Task",
      "Convert the user's outline into an estimate template structure (sections + placeholder line items).",
      "Parse numbered headers, blank lines, bullet lists, and indented lines into sections and items.",
      "Propose a clear template name and short description.",
    ].join("\n"),
    `## User outline\n${input.userOutline.trim()}`,
    formatOutputRulesBlock(input.locale),
  ].filter(Boolean);

  return blocks.join("\n\n");
}
