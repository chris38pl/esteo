import enTips from "@/messages/en/tips.json";
import plTips from "@/messages/pl/tips.json";
import { getTipHref, TIPS_CATALOG, type TipId } from "@/features/tips/lib/tips-catalog";
import type { Locale } from "@/lib/locale";

import type { TipSearchResultItem } from "./search-types";

const DEFAULT_LIMIT = 5;

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function getTipMessages(locale: Locale) {
  return locale === "pl" ? plTips : enTips;
}

function getTipCardCopy(locale: Locale, tipId: TipId) {
  const messages = getTipMessages(locale);
  const cards = messages.cards as Record<string, { title: string; description: string }>;
  return cards[tipId];
}

function getTipCategoryLabel(
  locale: Locale,
  categoryId: (typeof TIPS_CATALOG)[number]["categoryId"],
) {
  const messages = getTipMessages(locale);
  const categories = messages.categories as Record<string, string>;
  return categories[categoryId] ?? "";
}

export function searchTips(input: {
  query: string;
  locale: Locale;
  workspaceSlug: string;
  limit?: number;
}): TipSearchResultItem[] {
  const normalizedQuery = normalizeSearchText(input.query.trim());
  if (normalizedQuery.length < 2) {
    return [];
  }

  const limit = input.limit ?? DEFAULT_LIMIT;
  const results: TipSearchResultItem[] = [];

  for (const tip of TIPS_CATALOG) {
    const copy = getTipCardCopy(input.locale, tip.id);
    if (!copy) {
      continue;
    }

    const categoryLabel = getTipCategoryLabel(input.locale, tip.categoryId);
    const haystack = normalizeSearchText(`${copy.title} ${copy.description} ${categoryLabel}`);

    if (!haystack.includes(normalizedQuery)) {
      continue;
    }

    results.push({
      id: tip.id,
      title: copy.title,
      subtitle: categoryLabel,
      url: getTipHref(tip.id, input.locale, input.workspaceSlug),
    });

    if (results.length >= limit) {
      break;
    }
  }

  return results;
}
