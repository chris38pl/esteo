import { z } from "zod";

import {
  formatEstimateTemplateBlock,
  type PromptTemplateBlock,
} from "@/features/estimate-templates/lib/template-prompt-block";
import { TEMPLATE_GENERATION_MODES } from "@/features/estimate-templates/lib/template-generation-mode";

export type EstimateConfigurationSnapshot = {
  template?: {
    id: string;
    name: string;
    generationMode: (typeof TEMPLATE_GENERATION_MODES)[number];
    currency: string;
    sections: Array<{
      title: string;
      guidance: string | null;
      items: Array<{
        name: string;
        unit: string | null;
        unitPrice: string | null;
        vatRate: string | null;
        note: string | null;
        guidance: string | null;
      }>;
    }>;
  } | null;
};

const configurationSnapshotSchema = z.object({
  template: z
    .object({
      id: z.string(),
      name: z.string(),
      generationMode: z.enum(TEMPLATE_GENERATION_MODES).optional().default("SMART"),
      currency: z.string().optional().default("PLN"),
      sections: z.array(
        z.object({
          title: z.string(),
          guidance: z.string().nullable(),
          items: z.array(
            z.object({
              name: z.string(),
              unit: z.string().nullable(),
              unitPrice: z.string().nullable().optional(),
              vatRate: z.string().nullable().optional(),
              note: z.string().nullable().optional(),
              guidance: z.string().nullable(),
            }),
          ),
        }),
      ),
    })
    .nullable()
    .optional(),
});

export function parseConfigurationSnapshotFromAiMetadata(
  aiMetadata: unknown,
): EstimateConfigurationSnapshot | null {
  if (!aiMetadata || typeof aiMetadata !== "object") {
    return null;
  }

  const snapshot = (aiMetadata as Record<string, unknown>).configurationSnapshot;
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const parsed = configurationSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) {
    return null;
  }

  return parsed.data as EstimateConfigurationSnapshot;
}

export function resolveStoredConfigurationSnapshot(
  ...aiMetadataSources: unknown[]
): EstimateConfigurationSnapshot | undefined {
  for (const source of aiMetadataSources) {
    const snapshot = parseConfigurationSnapshotFromAiMetadata(source);
    if (snapshot !== null) {
      return snapshot;
    }
  }

  return undefined;
}

export function buildPromptBlocksFromConfigurationSnapshot(
  snapshot: EstimateConfigurationSnapshot,
  locale: "pl" | "en" = "pl",
): {
  templateForPrompt: PromptTemplateBlock | null;
  templatePromptBlock: string;
} {
  const templateForPrompt: PromptTemplateBlock | null = snapshot.template
    ? {
        name: snapshot.template.name,
        currency: snapshot.template.currency,
        generationMode: snapshot.template.generationMode,
        sections: snapshot.template.sections.map((section) => ({
          title: section.title,
          guidance: section.guidance,
          items: section.items.map((item) => ({
            name: item.name,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            note: item.note,
            guidance: item.guidance,
          })),
        })),
      }
    : null;

  return {
    templateForPrompt,
    templatePromptBlock: formatEstimateTemplateBlock(templateForPrompt, locale),
  };
}
