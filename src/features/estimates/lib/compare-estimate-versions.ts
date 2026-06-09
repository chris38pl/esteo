import type { EstimateVersionSnapshot } from "@/features/estimates/lib/estimate-agent-types";
import type { VersionTreeClient } from "@/features/estimates/lib/serialize-estimate";

export type VersionComparisonSummary = {
  baseVersionNumber: number;
  targetVersionNumber: number;
  grossDelta: number;
  addedItemsCount: number;
  removedItemsCount: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

type ItemFingerprint = {
  sectionTitle: string;
  sectionSortOrder: number;
  itemSortOrder: number;
  name: string;
  quantity: number;
  unitPrice: number;
};

function buildFingerprints(snapshot: EstimateVersionSnapshot): ItemFingerprint[] {
  return snapshot.sections.flatMap((section) =>
    section.items.map((item) => ({
      sectionTitle: section.title,
      sectionSortOrder: section.sortOrder,
      itemSortOrder: item.sortOrder,
      name: normalizeName(item.name),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  );
}

function positionKey(item: ItemFingerprint): string {
  return `${item.sectionSortOrder}:${item.itemSortOrder}:${item.sectionTitle}`;
}

function contentKey(item: ItemFingerprint): string {
  return `${positionKey(item)}:${item.name}:${item.quantity}:${item.unitPrice}`;
}

export function versionTreeToSnapshot(tree: VersionTreeClient): EstimateVersionSnapshot {
  return {
    marginPercent: tree.marginPercent,
    sections: tree.sections.map((section) => ({
      id: section.id,
      title: section.title,
      sortOrder: section.sortOrder,
      items: section.lineItems.map((item) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        sortOrder: item.sortOrder,
      })),
    })),
  };
}

export function compareEstimateVersions(input: {
  baseSnapshot: EstimateVersionSnapshot;
  targetSnapshot: EstimateVersionSnapshot;
  baseVersionNumber: number;
  targetVersionNumber: number;
  baseTotalGross?: number;
  targetTotalGross?: number;
}): VersionComparisonSummary {
  const baseItems = buildFingerprints(input.baseSnapshot);
  const targetItems = buildFingerprints(input.targetSnapshot);

  const baseByPosition = new Map<string, ItemFingerprint[]>();
  const targetByPosition = new Map<string, ItemFingerprint[]>();

  for (const item of baseItems) {
    const key = positionKey(item);
    const list = baseByPosition.get(key) ?? [];
    list.push(item);
    baseByPosition.set(key, list);
  }

  for (const item of targetItems) {
    const key = positionKey(item);
    const list = targetByPosition.get(key) ?? [];
    list.push(item);
    targetByPosition.set(key, list);
  }

  const matchedBase = new Set<string>();
  const matchedTarget = new Set<string>();

  for (const [key, baseList] of baseByPosition) {
    const targetList = targetByPosition.get(key);
    if (!targetList) {
      continue;
    }

    const usedTarget = new Set<number>();
    for (let i = 0; i < baseList.length; i++) {
      const baseItem = baseList[i];
      const baseContent = contentKey(baseItem);

      const matchIndex = targetList.findIndex(
        (targetItem, index) =>
          !usedTarget.has(index) && contentKey(targetItem) === baseContent,
      );

      if (matchIndex >= 0) {
        matchedBase.add(`${key}:${i}`);
        matchedTarget.add(`${key}:${matchIndex}`);
        usedTarget.add(matchIndex);
      }
    }
  }

  let addedItemsCount = 0;
  let removedItemsCount = 0;

  for (const [key, baseList] of baseByPosition) {
    for (let i = 0; i < baseList.length; i++) {
      if (!matchedBase.has(`${key}:${i}`)) {
        removedItemsCount += 1;
      }
    }
  }

  for (const [key, targetList] of targetByPosition) {
    for (let i = 0; i < targetList.length; i++) {
      if (!matchedTarget.has(`${key}:${i}`)) {
        addedItemsCount += 1;
      }
    }
  }

  const grossDelta =
    input.targetTotalGross != null && input.baseTotalGross != null
      ? roundMoney(input.targetTotalGross - input.baseTotalGross)
      : 0;

  return {
    baseVersionNumber: input.baseVersionNumber,
    targetVersionNumber: input.targetVersionNumber,
    grossDelta,
    addedItemsCount,
    removedItemsCount,
  };
}
