import type { LineItemData } from "@/features/estimates/components/estimate-line-item-row";

export function itemMatchesSearch(item: LineItemData, query: string): boolean {  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    item.name.toLowerCase().includes(q) ||
    (item.unit?.toLowerCase().includes(q) ?? false)
  );
}
