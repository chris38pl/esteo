import { COMPANY_DESCRIPTION_PROMPT_MAX_LENGTH } from "@/features/workspaces/schemas/company-description";

export function capCompanyDescriptionForPrompt(
  description: string,
  maxLength = COMPANY_DESCRIPTION_PROMPT_MAX_LENGTH,
): string {
  const trimmed = description.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.slice(0, maxLength);
}

export function formatCompanyContextBlock(
  description: string | null | undefined,
): string {
  if (!description?.trim()) {
    return "";
  }

  const capped = capCompanyDescriptionForPrompt(description);
  return `## Company context\n${capped}`;
}

export function buildWorkspacePromptFromRules(
  rules: Array<{ title: string; content: string }>,
): string {
  if (rules.length === 0) {
    return "";
  }

  return rules.map((rule) => `## ${rule.title}\n${rule.content}`).join("\n\n");
}

export function formatGeneralAiInstructionsBlock(
  aiInstructions: string | null | undefined,
): string {
  if (!aiInstructions?.trim()) {
    return "";
  }

  return `## Workspace rules\n${aiInstructions.trim()}`;
}

export function buildWorkspacePromptContext(input: {
  companyDescription?: string | null;
  aiInstructions?: string | null;
  rules: Array<{ title: string; content: string }>;
}): string {
  const companyBlock = formatCompanyContextBlock(input.companyDescription);
  const generalRulesBlock = formatGeneralAiInstructionsBlock(input.aiInstructions);
  const rulesBlock = buildWorkspacePromptFromRules(input.rules);

  return [companyBlock, generalRulesBlock, rulesBlock].filter(Boolean).join("\n\n");
}
