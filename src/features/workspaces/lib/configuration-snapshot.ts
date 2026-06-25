import { z } from "zod";

import {
  formatEstimateTemplateBlock,
  formatPriceListBlock,
  type PromptPriceListBlock,
  type PromptTemplateBlock,
} from "@/features/workspaces/lib/prompt-context";

export type EstimateConfigurationSnapshot = {
  template?: {
    id: string;
    name: string;
    sections: Array<{
      title: string;
      guidance: string | null;
      items: Array<{
        name: string;
        unit: string | null;
        guidance: string | null;
      }>;
    }>;
  } | null;
  priceList?: {
    id: string;
    name: string;
    currency: string;
    items: Array<{
      name: string;
      unit: string;
      unitPrice: string;
      vatRate: string | null;
      note: string | null;
    }>;
  } | null;
};

const configurationSnapshotSchema = z.object({
  template: z
    .object({
      id: z.string(),
      name: z.string(),
      sections: z.array(
        z.object({
          title: z.string(),
          guidance: z.string().nullable(),
          items: z.array(
            z.object({
              name: z.string(),
              unit: z.string().nullable(),
              guidance: z.string().nullable(),
            }),
          ),
        }),
      ),
    })
    .nullable()
    .optional(),
  priceList: z
    .object({
      id: z.string(),
      name: z.string(),
      currency: z.string(),
      items: z.array(
        z.object({
          name: z.string(),
          unit: z.string(),
          unitPrice: z.string(),
          vatRate: z.string().nullable(),
          note: z.string().nullable(),
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

  return parsed.data;
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
): {
  templateForPrompt: PromptTemplateBlock | null;
  priceListForPrompt: PromptPriceListBlock | null;
  templatePromptBlock: string;
  priceListPromptBlock: string;
} {
  const templateForPrompt: PromptTemplateBlock | null = snapshot.template
    ? {
        name: snapshot.template.name,
        sections: snapshot.template.sections.map((section) => ({
          title: section.title,
          guidance: section.guidance,
          items: section.items.map((item) => ({
            name: item.name,
            unit: item.unit,
            guidance: item.guidance,
          })),
        })),
      }
    : null;

  const priceListForPrompt: PromptPriceListBlock | null = snapshot.priceList
    ? {
        name: snapshot.priceList.name,
        currency: snapshot.priceList.currency,
        items: snapshot.priceList.items.map((item) => ({
          name: item.name,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          note: item.note,
        })),
      }
    : null;

  return {
    templateForPrompt,
    priceListForPrompt,
    templatePromptBlock: formatEstimateTemplateBlock(templateForPrompt),
    priceListPromptBlock: formatPriceListBlock(priceListForPrompt),
  };
}
