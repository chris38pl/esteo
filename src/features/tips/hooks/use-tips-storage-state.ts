"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getDismissedTipIds,
  getPinnedTipIds,
  isTipsBannerDismissedForSession,
} from "@/features/tips/lib/tips-storage";

export function useTipsStorageState(userId: string | null, workspaceSlug: string) {
  const [revision, setRevision] = useState(0);
  const [hasHydrated, setHasHydrated] = useState(false);

  const bump = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated || !userId) {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key?.includes(userId) && event.key.includes(workspaceSlug)) {
        bump();
      }
    };

    const onLocalChange = (event: Event) => {
      const detail = (event as CustomEvent<{ workspaceSlug?: string; userId?: string }>).detail;
      if (detail?.workspaceSlug === workspaceSlug && detail?.userId === userId) {
        bump();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("esteo:tips-storage-changed", onLocalChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("esteo:tips-storage-changed", onLocalChange);
    };
  }, [workspaceSlug, userId, bump, hasHydrated]);

  const state = useMemo(() => {
    if (!hasHydrated || !userId) {
      return {
        dismissedIds: [] as ReturnType<typeof getDismissedTipIds>,
        pinnedIds: [] as ReturnType<typeof getPinnedTipIds>,
        isBannerDismissedForSession: false,
      };
    }

    return {
      dismissedIds: getDismissedTipIds(userId, workspaceSlug),
      pinnedIds: getPinnedTipIds(userId, workspaceSlug),
      isBannerDismissedForSession: isTipsBannerDismissedForSession(userId, workspaceSlug),
    };
  }, [hasHydrated, revision, userId, workspaceSlug]);

  return { ...state, hasHydrated, refreshTipsStorage: bump };
}
