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

export function estimateVersionToTemplateDraft(input: {
  name: string;
  description?: string;
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
    sections,
  };

  const payload = {
    name: draft.name,
    description: draft.description || null,
    sections: draft.sections.map((section, sectionIndex) => ({
      title: section.title,
      guidance: null,
      sortOrder: sectionIndex,
      items: section.items.map((item, itemIndex) => ({
        name: item.name,
        unit: item.unit || null,
        guidance: null,
        sortOrder: itemIndex,
      })),
    })),
  };

  const parsed = estimateTemplateInputSchema.safeParse(payload);
  if (!parsed.success || parsed.data.sections.length === 0) {
    throw new EstimateImportEmptyStructureError();
  }

  return draft;
}
