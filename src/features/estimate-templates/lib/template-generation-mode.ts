import type { EstimateTemplateGenerationMode } from "@prisma/client";

export type TemplateGenerationMode = EstimateTemplateGenerationMode;

export const TEMPLATE_GENERATION_MODES = ["CONSERVATIVE", "SMART"] as const satisfies readonly TemplateGenerationMode[];

export function isTemplateGenerationMode(value: string): value is TemplateGenerationMode {
  return value === "CONSERVATIVE" || value === "SMART";
}
