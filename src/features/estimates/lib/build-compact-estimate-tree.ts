import type {
  CompactEstimateTree,
  EstimateVersionSnapshot,
} from "@/features/estimates/lib/estimate-agent-types";

export function buildCompactEstimateTree(
  snapshot: EstimateVersionSnapshot,
): CompactEstimateTree {
  return {
    sections: snapshot.sections.map((section) => ({
      id: section.id,
      title: section.title,
      items: section.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unit: item.unit ?? null,
      })),
    })),
  };
}
