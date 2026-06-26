import type { SystemEstimateTemplate } from "@/features/estimate-templates/config/system-templates";
import type { TemplateGenerationMode } from "@/features/estimate-templates/lib/template-generation-mode";
import {
  isTemplateDecimalValue,
  normalizeTemplateDecimalInput,
  TEMPLATE_CURRENCY_LENGTH,
} from "@/features/estimate-templates/lib/template-pricing";
import type { SerializedTemplate } from "@/features/workspace-configuration/server/service";

export type TemplateItemDraft = {
  id: string;
  name: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  note: string;
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
  generationMode: TemplateGenerationMode;
  currency: string;
  sections: TemplateSectionDraft[];
};

export function createTemplateDraftId(): string {
  return crypto.randomUUID();
}

function emptyTemplateItem(sortOrder = 0): TemplateItemDraft {
  return {
    id: createTemplateDraftId(),
    name: "",
    unit: "",
    unitPrice: "",
    vatRate: "",
    note: "",
    sortOrder,
  };
}

export function emptyTemplateDraft(defaultName = ""): TemplateEditorDraft {
  return {
    name: defaultName,
    description: "",
    generationMode: "SMART",
    currency: "PLN",
    sections: [
      {
        id: createTemplateDraftId(),
        title: "",
        guidance: "",
        sortOrder: 0,
        items: [emptyTemplateItem(0)],
      },
    ],
  };
}

function nullableString(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function decimalToDraftString(value: string | null | undefined): string {
  return nullableString(value);
}

export function templateToEditorDraft(
  template: SerializedTemplate | SystemEstimateTemplate,
): TemplateEditorDraft {
  return {
    name: template.name,
    description: template.description ?? "",
    generationMode: template.generationMode ?? "SMART",
    currency: template.currency ?? "PLN",
    sections: template.sections.map((section, sectionIndex) => ({
      id: "id" in section && section.id ? section.id : createTemplateDraftId(),
      title: section.title,
      guidance: section.guidance ?? "",
      sortOrder: section.sortOrder ?? sectionIndex,
      items: section.items.map((item, itemIndex) => ({
        id: "id" in item && item.id ? item.id : createTemplateDraftId(),
        name: item.name,
        unit: item.unit ?? "",
        unitPrice: decimalToDraftString(item.unitPrice),
        vatRate: decimalToDraftString(item.vatRate),
        note: item.note ?? "",
        sortOrder: item.sortOrder ?? itemIndex,
      })),
    })),
  };
}

export function isTemplateItemSavable(item: TemplateItemDraft): boolean {
  return Boolean(
    item.name.trim() &&
      item.unit.trim() &&
      isTemplateDecimalValue(item.unitPrice, true) &&
      isTemplateDecimalValue(item.vatRate, false),
  );
}

export function buildTemplatePayload(draft: TemplateEditorDraft) {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    generationMode: draft.generationMode,
    currency: draft.currency.trim().toUpperCase().slice(0, TEMPLATE_CURRENCY_LENGTH) || "PLN",
    sections: draft.sections
      .map((section, sectionIndex) => ({
        title: section.title.trim(),
        guidance: section.guidance.trim() || null,
        sortOrder: sectionIndex,
        items: section.items
          .filter(isTemplateItemSavable)
          .map((item, itemIndex) => ({
            name: item.name.trim(),
            unit: item.unit.trim(),
            unitPrice: normalizeTemplateDecimalInput(item.unitPrice),
            vatRate: item.vatRate.trim()
              ? normalizeTemplateDecimalInput(item.vatRate)
              : null,
            note: item.note.trim() || null,
            guidance: null,
            sortOrder: itemIndex,
          })),
      }))
      .filter((section) => section.title && section.items.length > 0),
  };
}

export function isTemplateDraftSavable(draft: TemplateEditorDraft): boolean {
  const payload = buildTemplatePayload(draft);
  return Boolean(
    draft.name.trim() &&
      draft.currency.trim().length === TEMPLATE_CURRENCY_LENGTH &&
      payload.sections.length > 0,
  );
}

export function mergeTemplateDraftAfterSave(
  draft: TemplateEditorDraft,
  saved: SerializedTemplate,
): TemplateEditorDraft {
  const savedDraft = templateToEditorDraft(saved);
  const trailingSections = draft.sections
    .map((section) => {
      const savedSection = savedDraft.sections.find(
        (candidate) => candidate.title === section.title.trim(),
      );
      const incompleteItems = section.items.filter((item) => !isTemplateItemSavable(item));
      if (incompleteItems.length === 0) {
        return null;
      }
      return {
        ...(savedSection ?? section),
        items: [...(savedSection?.items ?? []), ...incompleteItems],
      };
    })
    .filter((section): section is TemplateSectionDraft => section !== null);

  if (trailingSections.length === 0) {
    return savedDraft;
  }

  return {
    ...savedDraft,
    sections: savedDraft.sections.map((section) => {
      const trailing = trailingSections.find((candidate) => candidate.id === section.id);
      return trailing ?? section;
    }),
  };
}
