import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

import {
  buildEstimateDraftPrompt,
  type EstimateDraftPromptInput,
} from "@/ai/prompts/estimate-draft";
import { estimateDraftOutputSchema, type EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";
import { usageFromAiSdk } from "@evals/engine/cost/cost-tracker";
import type { TokenUsage } from "@evals/engine/types";

export type EvalGenerationResult = {
  prompt: string;
  object: EstimateDraftOutput;
  rawResponse: string;
  usage: TokenUsage;
  model: string;
};

export async function generateEstimateForEval(
  input: EstimateDraftPromptInput,
  modelName = process.env.EVAL_GENERATION_MODEL ?? "gpt-4o",
): Promise<EvalGenerationResult> {
  const prompt = buildEstimateDraftPrompt(input);

  const result = await generateObject({
    model: openai(modelName),
    schema: estimateDraftOutputSchema,
    schemaName: "EstimateDraft",
    schemaDescription: "A structured estimate draft with sections and line items.",
    prompt,
    temperature: 0,
  });

  const rawResponse = JSON.stringify(result.object, null, 2);

  return {
    prompt,
    object: result.object,
    rawResponse,
    usage: usageFromAiSdk(result.usage),
    model: modelName,
  };
}
