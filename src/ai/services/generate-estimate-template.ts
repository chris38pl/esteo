import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

import {
  buildTemplateGenerationPrompt,
  type TemplateGenerationPromptInput,
} from "@/ai/prompts/template-generation";
import {
  templateGenerationOutputSchema,
  type TemplateGenerationOutput,
} from "@/ai/schemas/template-generation-output";

export async function generateEstimateTemplate(
  input: TemplateGenerationPromptInput,
): Promise<TemplateGenerationOutput> {
  const prompt = buildTemplateGenerationPrompt(input);

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: templateGenerationOutputSchema,
    schemaName: "EstimateTemplateDraft",
    schemaDescription:
      "Estimate template structure with sections and placeholder line items.",
    prompt,
  });

  return object;
}
