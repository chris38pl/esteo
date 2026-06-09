import type { VersionTreeClient } from "@/features/estimates/lib/serialize-estimate";

export function versionTreeStructureKey(tree: VersionTreeClient | null): string {
  if (!tree) return "";

  return tree.sections
    .map((section) => {
      const itemIds = section.lineItems.map((item) => item.id).join(",");
      return `${section.id}[${itemIds}]`;
    })
    .join("|");
}

export function shouldApplyVersionTreeFromServer(input: {
  isDirty: boolean;
  isSaving: boolean;
  generationJustFinished: boolean;
  forceApply: boolean;
}): boolean {
  if (input.forceApply || input.generationJustFinished) {
    return true;
  }

  if (input.isDirty || input.isSaving) {
    return false;
  }

  return true;
}
