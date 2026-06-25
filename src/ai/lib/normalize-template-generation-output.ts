import type { TemplateGenerationOutput } from "@/ai/schemas/template-generation-output";
import {
  createTemplateDraftId,
  type TemplateEditorDraft,
} from "@/features/estimate-templates/lib/template-editor-draft";
import {
  ESTIMATE_TEMPLATE_DESCRIPTION_MAX_LENGTH,
  ESTIMATE_TEMPLATE_GUIDANCE_MAX_LENGTH,
  ESTIMATE_TEMPLATE_ITEM_NAME_MAX_LENGTH,
  ESTIMATE_TEMPLATE_MAX_ITEMS_PER_SECTION,
  ESTIMATE_TEMPLATE_MAX_ITEMS_TOTAL,
  ESTIMATE_TEMPLATE_MAX_SECTIONS,
  ESTIMATE_TEMPLATE_NAME_MAX_LENGTH,
  ESTIMATE_TEMPLATE_SECTION_TITLE_MAX_LENGTH,
} from "@/features/estimate-templates/lib/template-limits";
import { estimateTemplateInputSchema } from "@/features/estimate-templates/schemas/estimate-template";

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

export function normalizeTemplateGenerationOutput(
  output: TemplateGenerationOutput,
): TemplateEditorDraft {
  let totalItems = 0;

  const sections = output.sections
    .slice(0, ESTIMATE_TEMPLATE_MAX_SECTIONS)
    .map((section, sectionIndex) => {
      const items = section.items
        .slice(0, ESTIMATE_TEMPLATE_MAX_ITEMS_PER_SECTION)
        .flatMap((item, itemIndex) => {
          if (totalItems >= ESTIMATE_TEMPLATE_MAX_ITEMS_TOTAL) {
            return [];
          }

          const name = truncate(item.name, ESTIMATE_TEMPLATE_ITEM_NAME_MAX_LENGTH);
          if (!name) {
            return [];
          }

          totalItems += 1;
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
      if (!title) {
        return null;
      }

      return {
        id: createTemplateDraftId(),
        title,
        guidance: truncate(
          nullableToString(section.guidance),
          ESTIMATE_TEMPLATE_GUIDANCE_MAX_LENGTH,
        ),
        sortOrder: section.sortOrder ?? sectionIndex,
        items,
      };
    })
    .filter((section): section is NonNullable<typeof section> => section !== null);

  const draft: TemplateEditorDraft = {
    name: truncate(output.name, ESTIMATE_TEMPLATE_NAME_MAX_LENGTH),
    description: truncate(
      nullableToString(output.description),
      ESTIMATE_TEMPLATE_DESCRIPTION_MAX_LENGTH,
    ),
    sections,
  };

  const payload = {
    name: draft.name,
    description: draft.description || null,
    sections: draft.sections.map((section, sectionIndex) => ({
      title: section.title,
      guidance: section.guidance || null,
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
  if (!parsed.success) {
    throw new Error("AI returned an invalid template structure.");
  }

  if (process.env.NODE_ENV === "development") {
    const rawItemCount = output.sections.reduce(
      (sum, section) => sum + section.items.length,
      0,
    );
    if (rawItemCount > ESTIMATE_TEMPLATE_MAX_ITEMS_TOTAL) {
      console.warn(
        `[template-generation] Trimmed items from ${rawItemCount} to ${totalItems}`,
      );
    }
  }

  return draft;
}
