import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

import { buildEstimateAgentPrompt, type EstimateAgentPromptInput } from "@/ai/prompts/estimate-agent";
import { estimateAgentPatchSchema, type EstimateAgentPatch } from "@/ai/schemas/estimate-agent-patch";

export async function proposeEstimateEdit(
  input: EstimateAgentPromptInput,
): Promise<EstimateAgentPatch> {
  const prompt = buildEstimateAgentPrompt(input);

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: estimateAgentPatchSchema,
    schemaName: "EstimateAgentPatch",
    schemaDescription: "A patch describing changes to apply to the current estimate.",
    prompt,
  });

  return object;
}
