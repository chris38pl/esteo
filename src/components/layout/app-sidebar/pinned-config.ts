import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";

export type PinnedEstimateSidebarItem = {
  estimateId: string;
  /** User-defined estimate title from DB - not translated in UI. */
  title: string;
  /** ISO timestamp of last modification from DB. */
  updatedAt: string;
  workspaceSlug: string;
};

export type PinnedItem = {
  key: string;
  title: string;
  updatedAt: string;
  href: (locale: string) => string;
  icon: LucideIcon;
};

export function toPinnedNavItem(item: PinnedEstimateSidebarItem): PinnedItem {
  return {
    key: item.estimateId,
    title: item.title,
    updatedAt: item.updatedAt,
    href: (locale) =>
      `/${locale}/dashboard/${item.workspaceSlug}/estimates/${item.estimateId}`,
    icon: FileText,
  };
}

export function orderPinnedNavItems(
  order: string[],
  items: PinnedEstimateSidebarItem[],
): PinnedItem[] {
  const byId = new Map(items.map((item) => [item.estimateId, item]));
  const ordered: PinnedItem[] = [];

  for (const estimateId of order) {
    const item = byId.get(estimateId);
    if (item) {
      ordered.push(toPinnedNavItem(item));
      byId.delete(estimateId);
    }
  }

  for (const item of byId.values()) {
    ordered.push(toPinnedNavItem(item));
  }

  return ordered;
}
