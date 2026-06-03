import { buildWorkspacePromptContext } from "@/features/workspaces/lib/prompt-context";

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
  companyDescription?: string | null;
  aiInstructions?: string | null;
  rules: Array<{ title: string; content: string }>;
  locale: string;
}

export function buildEstimateAgentPrompt(input: EstimateAgentPromptInput): string {
  const contextBlock = buildWorkspacePromptContext({
    companyDescription: input.companyDescription,
    aiInstructions: input.aiInstructions,
    rules: input.rules,
  });

  const currentStateBlock = [
    "## Current estimate state",
    `Global margin: ${input.currentVersion.marginPercent}%`,
    "",
    JSON.stringify(input.currentVersion.sections, null, 2),
  ].join("\n");

  const userBlock = `## User request\n${input.userMessage.trim()}`;

  const instrBlock = [
    "## Instructions",
    `- Respond in language: ${input.locale === "pl" ? "Polish (pl)" : "English (en)"}`,
    "- Return only a patch describing what to change — do NOT return the full estimate.",
    "- Reference existing items by their id when updating or deleting.",
    "- For additions, specify the sectionTitle to add items to (use existing section title or a new one).",
    "- Use empty arrays for additions, updates, deletions, and newSections when there are no changes of that type.",
    "- In each update object, set name/unit/quantity/unitPrice/vatRate to null for fields that must not change.",
    "- Set unit to null on new line items when no unit applies.",
    "- Set marginPercent to null when the global margin should not change.",
    "- Set reasoning to null when no explanation is needed.",
    "- Set vatRate as a decimal fraction (e.g. 0.23 for 23%).",
  ].join("\n");

  return [contextBlock, currentStateBlock, userBlock, instrBlock]
    .filter(Boolean)
    .join("\n\n");
}
