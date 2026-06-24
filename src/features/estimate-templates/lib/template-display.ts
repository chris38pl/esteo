import type {
  SerializedTemplate,
  SerializedTemplateSection,
} from "@/features/workspace-configuration/server/service";
import type { TemplateSectionDraft } from "./template-editor-draft";

export function countTemplateSections(template: Pick<SerializedTemplate, "sections">): number {
  return template.sections.length;
}

export function countTemplateItems(template: Pick<SerializedTemplate, "sections">): number {
  return template.sections.reduce(
    (sum: number, section: SerializedTemplateSection) => sum + section.items.length,
    0,
  );
}

export function countDraftSections(sections: TemplateSectionDraft[]): number {
  return sections.length;
}

export function countDraftItems(sections: TemplateSectionDraft[]): number {
  return sections.reduce(
    (sum: number, section: TemplateSectionDraft) => sum + section.items.length,
    0,
  );
}
