import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

import { buildEstimateDraftPrompt, type EstimateDraftPromptInput } from "@/ai/prompts/estimate-draft";
import { estimateDraftOutputSchema, type EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";

export async function generateEstimateDraft(
  input: EstimateDraftPromptInput,
): Promise<EstimateDraftOutput> {
  const prompt = buildEstimateDraftPrompt(input);

  if (process.env.NODE_ENV === "development") {
    console.info("[generateEstimateDraft] prompt length:", prompt.length);
  }

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: estimateDraftOutputSchema,
    schemaName: "EstimateDraft",
    schemaDescription: "A structured estimate draft with sections and line items.",
    prompt,
  });

  return object;
}
