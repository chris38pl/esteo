"use client";

import { useCallback, useRef, useState } from "react";

import type { RecentDocumentItem } from "@/features/search/lib/search-types";
import { listRecentDocumentsAction } from "@/features/search/server/actions";

const CACHE_TTL_MS = 60_000;

type CacheEntry = {
  items: RecentDocumentItem[];
  fetchedAt: number;
};

export function useRecentDocumentsCache(workspaceId: string | null, locale: "pl" | "en") {
  const cacheRef = useRef<CacheEntry | null>(null);
  const [items, setItems] = useState<RecentDocumentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const invalidate = useCallback(() => {
    cacheRef.current = null;
  }, []);

  const load = useCallback(
    async (force = false) => {
      if (!workspaceId) {
        setItems([]);
        return [];
      }

      const now = Date.now();
      if (
        !force &&
        cacheRef.current &&
        now - cacheRef.current.fetchedAt < CACHE_TTL_MS
      ) {
        setItems(cacheRef.current.items);
        return cacheRef.current.items;
      }

      setLoading(true);
      try {
        const fetched = await listRecentDocumentsAction({ workspaceId, locale });
        cacheRef.current = { items: fetched, fetchedAt: now };
        setItems(fetched);
        return fetched;
      } finally {
        setLoading(false);
      }
    },
    [workspaceId, locale],
  );

  return { items, loading, load, invalidate };
}
