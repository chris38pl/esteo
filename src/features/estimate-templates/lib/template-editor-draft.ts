import type { SystemEstimateTemplate } from "@/features/estimate-templates/config/system-templates";
import type { SerializedTemplate } from "@/features/workspace-configuration/server/service";

export type TemplateItemDraft = {
  id: string;
  name: string;
  unit: string;
  sortOrder: number;
};

export type TemplateSectionDraft = {
  id: string;
  title: string;
  guidance: string;
  sortOrder: number;
  items: TemplateItemDraft[];
};

export type TemplateEditorDraft = {
  name: string;
  description: string;
  sections: TemplateSectionDraft[];
};

export function createTemplateDraftId(): string {
  return crypto.randomUUID();
}

export function emptyTemplateDraft(): TemplateEditorDraft {
  return {
    name: "",
    description: "",
    sections: [
      {
        id: createTemplateDraftId(),
        title: "",
        guidance: "",
        sortOrder: 0,
        items: [{ id: createTemplateDraftId(), name: "", unit: "", sortOrder: 0 }],
      },
    ],
  };
}

export function templateToEditorDraft(
  template: SerializedTemplate | SystemEstimateTemplate,
): TemplateEditorDraft {
  return {
    name: template.name,
    description: template.description ?? "",
    sections: template.sections.map((section, sectionIndex) => ({
      id: "id" in section && section.id ? section.id : createTemplateDraftId(),
      title: section.title,
      guidance: section.guidance ?? "",
      sortOrder: section.sortOrder ?? sectionIndex,
      items: section.items.map((item, itemIndex) => ({
        id: "id" in item && item.id ? item.id : createTemplateDraftId(),
        name: item.name,
        unit: item.unit ?? "",
        sortOrder: item.sortOrder ?? itemIndex,
      })),
    })),
  };
}

export function buildTemplatePayload(draft: TemplateEditorDraft) {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    sections: draft.sections
      .map((section, sectionIndex) => ({
        title: section.title.trim(),
        guidance: section.guidance.trim() || null,
        sortOrder: sectionIndex,
        items: section.items
          .map((item, itemIndex) => ({
            name: item.name.trim(),
            unit: item.unit.trim() || null,
            guidance: null,
            sortOrder: itemIndex,
          }))
          .filter((item) => item.name),
      }))
      .filter((section) => section.title),
  };
}

export function isTemplateDraftSavable(draft: TemplateEditorDraft): boolean {
  const payload = buildTemplatePayload(draft);
  return Boolean(draft.name.trim() && payload.sections.length > 0);
}
