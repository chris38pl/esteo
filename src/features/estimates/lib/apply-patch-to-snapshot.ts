import type { EstimateAgentPatch } from "@/ai/schemas/estimate-agent-patch";
import type { EstimateVersionSnapshot } from "@/features/estimates/lib/estimate-agent-types";

function cloneSnapshot(snapshot: EstimateVersionSnapshot): EstimateVersionSnapshot {
  return {
    marginPercent: snapshot.marginPercent,
    sections: snapshot.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item })),
    })),
  };
}

export function applyPatchToSnapshot(
  snapshot: EstimateVersionSnapshot,
  patch: EstimateAgentPatch,
): EstimateVersionSnapshot {
  const next = cloneSnapshot(snapshot);

  if (patch.marginPercent != null) {
    next.marginPercent = patch.marginPercent;
  }

  if (patch.newSections.length > 0) {
    const maxOrder = next.sections.reduce(
      (max, section) => Math.max(max, section.sortOrder),
      -1,
    );
    let nextOrder = maxOrder + 1;
    for (const ns of patch.newSections) {
      next.sections.push({
        id: `new-section-${next.sections.length}-${ns.title}`,
        title: ns.title,
        sortOrder: ns.sortOrder ?? nextOrder++,
        items: [],
      });
    }
  }

  const itemById = new Map<
    string,
    { sectionIndex: number; itemIndex: number }
  >();
  next.sections.forEach((section, sectionIndex) => {
    section.items.forEach((item, itemIndex) => {
      itemById.set(item.id, { sectionIndex, itemIndex });
    });
  });

  for (const u of patch.updates) {
    const loc = itemById.get(u.itemId);
    if (!loc) {
      continue;
    }
    const item = next.sections[loc.sectionIndex].items[loc.itemIndex];
    if (u.name != null) item.name = u.name;
    if (u.unit != null) item.unit = u.unit;
    if (u.quantity != null) item.quantity = u.quantity;
    if (u.unitPrice != null) item.unitPrice = u.unitPrice;
    if (u.vatRate != null) item.vatRate = u.vatRate;
  }

  if (patch.deletions.length > 0) {
    const deleteSet = new Set(patch.deletions);
    next.sections = next.sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !deleteSet.has(item.id)),
      }))
      .filter((section) => section.items.length > 0 || section.items.length === 0);
  }

  for (const addition of patch.additions) {
    let section = next.sections.find((s) => s.title === addition.sectionTitle);
    if (!section) {
      const maxOrder = next.sections.reduce(
        (max, s) => Math.max(max, s.sortOrder),
        -1,
      );
      section = {
        id: `new-section-${next.sections.length}-${addition.sectionTitle}`,
        title: addition.sectionTitle,
        sortOrder: maxOrder + 1,
        items: [],
      };
      next.sections.push(section);
    }

    const maxItemOrder = section.items.reduce(
      (max, item) => Math.max(max, item.sortOrder),
      -1,
    );
    let nextItemOrder = maxItemOrder + 1;

    for (const item of addition.items) {
      const newId = `new-item-${section.id}-${section.items.length}`;
      section.items.push({
        id: newId,
        name: item.name,
        unit: item.unit ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        sortOrder: nextItemOrder++,
      });
    }
  }

  return next;
}
