import { buildWorkspacePromptContext } from "@/features/workspaces/lib/prompt-context";

export interface EstimateDraftPromptInput {
  projectDescription: string;
  companyDescription?: string | null;
  aiInstructions?: string | null;
  rules: Array<{ title: string; content: string }>;
  estimateSections?: Array<{ title: string; rule?: string }>;
  locale: string;
}

export function buildEstimateDraftPrompt(input: EstimateDraftPromptInput): string {
  const contextBlock = buildWorkspacePromptContext({
    companyDescription: input.companyDescription,
    aiInstructions: input.aiInstructions,
    estimateSections: input.estimateSections,
    rules: input.rules,
  });

  const briefBlock = `## Project brief\n${input.projectDescription.trim()}`;

  const instrBlock = [
    "## Instructions",
    `- Respond in language: ${input.locale === "pl" ? "Polish (pl)" : "English (en)"}`,
    "- Return a structured estimate draft based on the project brief above.",
    "- Group line items into logical sections.",
    "- Use realistic unit prices appropriate for the described work.",
    "- Set vatRate as a decimal fraction (e.g. 0.23 for 23% VAT).",
    "- Set unit to null when the line item has no unit of measure.",
    "- Set suggestedMarginPercent to null when you are not suggesting a global margin.",
    "- Use sequential sortOrder values starting at 0 within each section.",
    "- Do not include explanatory prose — return only the structured output.",
  ].join("\n");

  return [contextBlock, briefBlock, instrBlock].filter(Boolean).join("\n\n");
}
