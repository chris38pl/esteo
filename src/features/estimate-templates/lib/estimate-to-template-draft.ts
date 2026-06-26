import type { VersionTreeClient } from "@/features/estimates/lib/serialize-estimate";
import {
  createTemplateDraftId,
  type TemplateEditorDraft,
} from "@/features/estimate-templates/lib/template-editor-draft";
import {
  ESTIMATE_TEMPLATE_DESCRIPTION_MAX_LENGTH,
  ESTIMATE_TEMPLATE_ITEM_NAME_MAX_LENGTH,
  ESTIMATE_TEMPLATE_NAME_MAX_LENGTH,
  ESTIMATE_TEMPLATE_SECTION_TITLE_MAX_LENGTH,
} from "@/features/estimate-templates/lib/template-limits";
import { estimateTemplateInputSchema } from "@/features/estimate-templates/schemas/estimate-template";

export class EstimateImportEmptyStructureError extends Error {
  constructor() {
    super("Estimate has no importable structure.");
    this.name = "EstimateImportEmptyStructureError";
  }
}

function truncate(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.slice(0, maxLength);
}

function nullableToString(value: string | null): string {
  return value?.trim() ?? "";
}

function formatImportedUnitPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }
  return value.toFixed(2);
}

function formatImportedVatRate(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "";
  }
  const normalized = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return normalized.replace(/\.?0+$/, "");
}

export function estimateVersionToTemplateDraft(input: {
  name: string;
  description?: string;
  currency?: string;
  versionTree: VersionTreeClient;
}): TemplateEditorDraft {
  const sections = input.versionTree.sections
    .map((section, sectionIndex) => {
      const items = section.lineItems.flatMap((item, itemIndex) => {
        const name = truncate(item.name, ESTIMATE_TEMPLATE_ITEM_NAME_MAX_LENGTH);
        if (!name) {
          return [];
        }

        return [
          {
            id: createTemplateDraftId(),
            name,
            unit: truncate(nullableToString(item.unit), 24),
            unitPrice: formatImportedUnitPrice(item.unitPrice),
            vatRate: formatImportedVatRate(item.vatRate),
            note: "",
            sortOrder: item.sortOrder ?? itemIndex,
          },
        ];
      });

      const title = truncate(section.title, ESTIMATE_TEMPLATE_SECTION_TITLE_MAX_LENGTH);
      if (!title || items.length === 0) {
        return null;
      }

      return {
        id: createTemplateDraftId(),
        title,
        guidance: "",
        sortOrder: section.sortOrder ?? sectionIndex,
        items,
      };
    })
    .filter((section): section is NonNullable<typeof section> => section !== null);

  const draft: TemplateEditorDraft = {
    name: truncate(input.name, ESTIMATE_TEMPLATE_NAME_MAX_LENGTH),
    description: truncate(
      nullableToString(input.description ?? ""),
      ESTIMATE_TEMPLATE_DESCRIPTION_MAX_LENGTH,
    ),
    generationMode: "SMART",
    currency: (input.currency ?? "PLN").trim().toUpperCase().slice(0, 3) || "PLN",
    sections,
  };

  const payload = buildTemplatePayloadFromDraft(draft);
  const parsed = estimateTemplateInputSchema.safeParse(payload);
  if (!parsed.success || parsed.data.sections.length === 0) {
    throw new EstimateImportEmptyStructureError();
  }

  return draft;
}

function buildTemplatePayloadFromDraft(draft: TemplateEditorDraft) {
  return {
    name: draft.name,
    description: draft.description || null,
    generationMode: draft.generationMode,
    currency: draft.currency,
    sections: draft.sections.map((section, sectionIndex) => ({
      title: section.title,
      guidance: null,
      sortOrder: sectionIndex,
      items: section.items
        .filter((item) => item.name && item.unit && item.unitPrice)
        .map((item, itemIndex) => ({
          name: item.name,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate || null,
          note: null,
          guidance: null,
          sortOrder: itemIndex,
        })),
    })),
  };
}
