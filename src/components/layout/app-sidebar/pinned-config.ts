import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";

export type PinnedItem = {
  key: string;
  /** User-defined estimate title from DB — not translated in UI. */
  title: string;
  /** ISO timestamp of last modification from DB. */
  updatedAt: string;
  href: (locale: string) => string;
  icon: LucideIcon;
};

/** Placeholder until pinned estimates are loaded from the API. */
export const pinnedItems: PinnedItem[] = [
  {
    key: "estimate-1",
    title: "Dom jednorodzinny — etap I",
    updatedAt: "2026-05-20T14:32:00.000Z",
    href: (locale) => `/${locale}/dashboard?estimate=estimate-1`,
    icon: FileText,
  },
  {
    key: "estimate-2",
    title: "Remont łazienki — Mokotów",
    updatedAt: "2026-05-24T09:15:00.000Z",
    href: (locale) => `/${locale}/dashboard?estimate=estimate-2`,
    icon: FileText,
  },
];

export const DEFAULT_PINNED_ORDER = pinnedItems.map((item) => item.key);

const pinnedByKey = new Map(pinnedItems.map((item) => [item.key, item]));

export function getPinnedItem(key: string) {
  return pinnedByKey.get(key);
}

export function resolvePinnedOrder(order: string[]) {
  const known = new Set(DEFAULT_PINNED_ORDER);
  const valid = order.filter((key) => known.has(key));
  const missing = DEFAULT_PINNED_ORDER.filter((key) => !valid.includes(key));
  return [...valid, ...missing];
}

export function orderPinnedItems(order: string[]) {
  return resolvePinnedOrder(order)
    .map((key) => getPinnedItem(key))
    .filter((item): item is PinnedItem => Boolean(item));
}
