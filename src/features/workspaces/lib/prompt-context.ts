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

export function formatBusinessTypeBlock(
  industryOtherText: string | null | undefined,
): string {
  const trimmed = industryOtherText?.trim();
  if (!trimmed) {
    return "";
  }

  return `## Business Type\n${trimmed}`;
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

export type PromptTemplateBlock = {
  name: string;
  sections: Array<{
    title: string;
    guidance?: string | null;
    items: Array<{
      name: string;
      unit?: string | null;
      guidance?: string | null;
    }>;
  }>;
};

export type PromptPriceListBlock = {
  name: string;
  currency: string;
  items: Array<{
    name: string;
    unit: string;
    unitPrice: string;
    vatRate?: string | null;
    note?: string | null;
  }>;
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
    "If a section has no line items, omit that section entirely — do not return empty sections.",
    "Only include sections from the list below that apply and have at least one line item.",
    "Do not rename sections arbitrarily.",
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

export function formatEstimateTemplateBlock(template: PromptTemplateBlock | null): string {
  if (!template || template.sections.length === 0) {
    return "";
  }

  const lines: string[] = [
    "## Estimate Template",
    `Template name: ${template.name}`,
    "Use this template as the preferred estimate structure for this project.",
    "Prefer using template items whenever they fit the project scope.",
    "Remove items that are clearly outside the project scope.",
    "Add missing items when necessary.",
    "Do not create empty sections.",
  ];

  template.sections.forEach((section, sectionIndex) => {
    lines.push(`${sectionIndex + 1}. ${section.title}`);
    if (section.guidance?.trim()) {
      lines.push(`   Guidance: ${section.guidance.trim()}`);
    }
    section.items.forEach((item) => {
      const unit = item.unit?.trim() ? ` [unit: ${item.unit.trim()}]` : "";
      const guidance = item.guidance?.trim() ? ` — ${item.guidance.trim()}` : "";
      lines.push(`   - ${item.name}${unit}${guidance}`);
    });
  });

  return lines.join("\n");
}

export function formatPriceListBlock(priceList: PromptPriceListBlock | null): string {
  if (!priceList || priceList.items.length === 0) {
    return "";
  }

  const lines: string[] = [
    "## Price List",
    `Price list name: ${priceList.name}`,
    `Currency: ${priceList.currency}`,
    "Use a price list price only when both the service name and billing unit match with high confidence.",
    "Semantic name variants are allowed, for example 'Malowanie' and 'Malowanie ścian'.",
    "Equivalent units such as 'm²' and 'm2' may be treated as the same unit.",
    "Do not use a price list price when the unit differs, for example 'm²' vs 'roboczogodzina' or 'rbh'.",
    "If you are not confident about the match, estimate the price normally instead of forcing the price list value.",
  ];

  priceList.items.forEach((item) => {
    const vat = item.vatRate ? `, vatRate: ${item.vatRate}` : "";
    const note = item.note?.trim() ? `, note: ${item.note.trim()}` : "";
    lines.push(`- ${item.name} | unit: ${item.unit} | unitPrice: ${item.unitPrice}${vat}${note}`);
  });

  return lines.join("\n");
}

export function buildWorkspacePromptContext(input: {
  companyDescription?: string | null;
  aiInstructions?: string | null;
  estimateSections?: PromptEstimateSection[];
  rules: Array<{ title: string; content: string }>;
  templatePromptBlock?: string;
  priceListPromptBlock?: string;
}): string {
  const companyBlock = formatCompanyContextBlock(input.companyDescription);
  const generalRulesBlock = formatGeneralAiInstructionsBlock(input.aiInstructions);
  const structureBlock = formatEstimateStructureBlock(input.estimateSections ?? []);
  const sectionRulesBlock = formatSectionRulesBlock(input.estimateSections ?? []);
  const rulesBlock = buildWorkspacePromptFromRules(input.rules);

  return [
    companyBlock,
    generalRulesBlock,
    structureBlock,
    sectionRulesBlock,
    input.templatePromptBlock,
    input.priceListPromptBlock,
    rulesBlock,
  ]
    .filter(Boolean)
    .join("\n\n");
}
