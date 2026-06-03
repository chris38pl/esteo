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
  return `## Company Context\n${capped}`;
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

  return `## Workspace Rules\n${aiInstructions.trim()}`;
}

export type PromptEstimateSection = {
  title: string;
  rule?: string;
};

export function formatEstimateStructureBlock(
  sections: PromptEstimateSection[],
): string {
  if (sections.length === 0) {
    return "";
  }

  const lines = sections.map(
    (section, index) => `${index + 1}. ${section.title}`,
  );

  return [
    "## Estimate Structure",
    "Use the sections below in this order with these exact titles when they apply to the project scope.",
    "Do not invent unrelated section names when configured sections cover the work.",
    "If a section is clearly out of scope, omit it or leave it without line items — do not rename sections arbitrarily.",
    lines.join("\n"),
  ].join("\n");
}

export function formatSectionRulesBlock(
  sections: PromptEstimateSection[],
): string {
  const withRules = sections.filter((section) => section.rule?.trim());
  if (withRules.length === 0) {
    return "";
  }

  const blocks = withRules.map(
    (section) => `### ${section.title}\n${section.rule!.trim()}`,
  );

  return ["## Section-Specific Rules", ...blocks].join("\n\n");
}

export function buildWorkspacePromptContext(input: {
  companyDescription?: string | null;
  aiInstructions?: string | null;
  estimateSections?: PromptEstimateSection[];
  rules: Array<{ title: string; content: string }>;
}): string {
  const companyBlock = formatCompanyContextBlock(input.companyDescription);
  const generalRulesBlock = formatGeneralAiInstructionsBlock(input.aiInstructions);
  const structureBlock = formatEstimateStructureBlock(input.estimateSections ?? []);
  const sectionRulesBlock = formatSectionRulesBlock(input.estimateSections ?? []);
  const rulesBlock = buildWorkspacePromptFromRules(input.rules);

  return [companyBlock, generalRulesBlock, structureBlock, sectionRulesBlock, rulesBlock]
    .filter(Boolean)
    .join("\n\n");
}
