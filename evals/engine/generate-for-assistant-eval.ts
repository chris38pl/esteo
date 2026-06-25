import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

import {
  buildEstimateAgentPrompt,
  type EstimateAgentPromptInput,
} from "@/ai/prompts/estimate-agent";
import {
  estimateAgentPatchSchema,
  type EstimateAgentPatch,
} from "@/ai/schemas/estimate-agent-patch";
import { usageFromAiSdk } from "@evals/engine/cost/cost-tracker";
import type { TokenUsage } from "@evals/engine/types";

export type AssistantEvalResult = {
  prompt: string;
  patch: EstimateAgentPatch;
  rawResponse: string;
  usage: TokenUsage;
  model: string;
};

export async function generateAssistantPatchForEval(
  input: EstimateAgentPromptInput,
  modelName = process.env.EVAL_GENERATION_MODEL ?? "gpt-4o",
): Promise<AssistantEvalResult> {
  const prompt = buildEstimateAgentPrompt(input);

  const result = await generateObject({
    model: openai(modelName),
    schema: estimateAgentPatchSchema,
    schemaName: "EstimateAgentPatch",
    schemaDescription: "A patch describing changes to apply to the current estimate.",
    prompt,
    temperature: 0,
  });

  return {
    prompt,
    patch: result.object,
    rawResponse: JSON.stringify(result.object, null, 2),
    usage: usageFromAiSdk(result.usage),
    model: modelName,
  };
}
