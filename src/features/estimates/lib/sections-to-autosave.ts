import type { SectionData } from "@/features/estimates/components/estimate-items-table";
import { isPersistedEntityId } from "@/features/estimates/lib/persisted-entity-id";
import type { AutoSaveData } from "@/features/estimates/server/repository";

export { isPersistedEntityId } from "@/features/estimates/lib/persisted-entity-id";

export interface SectionsToAutoSaveResult {
  sections: NonNullable<AutoSaveData["sections"]>;
  skippedCount: number;
}

export function sectionsToAutoSaveData(sections: SectionData[]): SectionsToAutoSaveResult {
  const result: NonNullable<AutoSaveData["sections"]> = [];
  let skippedCount = 0;

  for (const section of sections) {
    if (!isPersistedEntityId(section.id)) {
      skippedCount += 1;
      console.warn("[estimate autosave] skipping section without persisted id", {
        kind: "section",
        id: section.id,
        title: section.title,
      });
      continue;
    }

    const items: NonNullable<AutoSaveData["sections"]>[number]["items"] = [];

    for (const item of section.items) {
      if (!isPersistedEntityId(item.id)) {
        skippedCount += 1;
        console.warn("[estimate autosave] skipping line item without persisted id", {
          kind: "lineItem",
          id: item.id,
          sectionId: section.id,
          name: item.name,
        });
        continue;
      }

      items.push({
        id: item.id,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        sortOrder: item.sortOrder,
      });
    }

    result.push({
      id: section.id,
      title: section.title,
      sortOrder: section.sortOrder,
      items,
    });
  }

  if (skippedCount > 0) {
    console.warn("[estimate autosave] omitted entities without persisted ids from payload", {
      skippedCount,
      sectionCount: sections.length,
    });
  }

  return { sections: result, skippedCount };
}
