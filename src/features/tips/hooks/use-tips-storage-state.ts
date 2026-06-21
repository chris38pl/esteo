"use client";

import { useCallback, useEffect, useState } from "react";

import type { TipId } from "@/features/tips/lib/tips-catalog";
import {
  dismissTipForUser,
  getDismissedTipIds,
  getPinnedTipIds,
  isTipsBannerDismissedForSession,
  MAX_PINNED_TIPS,
  toggleTipPin,
  type ToggleTipPinResult,
} from "@/features/tips/lib/tips-storage";

type TipsStorageSnapshot = {
  dismissedIds: TipId[];
  pinnedIds: TipId[];
  isBannerDismissedForSession: boolean;
};

const EMPTY_SNAPSHOT: TipsStorageSnapshot = {
  dismissedIds: [],
  pinnedIds: [],
  isBannerDismissedForSession: false,
};

function readSnapshot(userId: string, workspaceSlug: string): TipsStorageSnapshot {
  return {
    dismissedIds: getDismissedTipIds(userId, workspaceSlug),
    pinnedIds: getPinnedTipIds(userId, workspaceSlug),
    isBannerDismissedForSession: isTipsBannerDismissedForSession(userId, workspaceSlug),
  };
}

export function useTipsStorageState(userId: string | null, workspaceSlug: string) {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [snapshot, setSnapshot] = useState<TipsStorageSnapshot>(EMPTY_SNAPSHOT);

  const syncFromStorage = useCallback(() => {
    if (!userId) {
      setSnapshot(EMPTY_SNAPSHOT);
      return;
    }
    setSnapshot(readSnapshot(userId, workspaceSlug));
  }, [userId, workspaceSlug]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    syncFromStorage();
  }, [hasHydrated, syncFromStorage]);

  useEffect(() => {
    if (!hasHydrated || !userId) {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key?.includes(userId) && event.key.includes(workspaceSlug)) {
        syncFromStorage();
      }
    };

    const onLocalChange = (event: Event) => {
      const detail = (event as CustomEvent<{ workspaceSlug?: string; userId?: string }>).detail;
      if (detail?.workspaceSlug === workspaceSlug && detail?.userId === userId) {
        syncFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("esteo:tips-storage-changed", onLocalChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("esteo:tips-storage-changed", onLocalChange);
    };
  }, [workspaceSlug, userId, syncFromStorage, hasHydrated]);

  const togglePin = useCallback(
    (tipId: TipId): ToggleTipPinResult => {
      if (!userId) {
        return "max_reached";
      }

      let blockedByMax = false;

      setSnapshot((current) => {
        const isCurrentlyPinned = current.pinnedIds.includes(tipId);
        if (isCurrentlyPinned) {
          return {
            ...current,
            pinnedIds: current.pinnedIds.filter((id) => id !== tipId),
          };
        }
        if (current.pinnedIds.length >= MAX_PINNED_TIPS) {
          blockedByMax = true;
          return current;
        }
        return {
          ...current,
          pinnedIds: [...current.pinnedIds, tipId],
          dismissedIds: current.dismissedIds.filter((id) => id !== tipId),
        };
      });

      if (blockedByMax) {
        return "max_reached";
      }

      const result = toggleTipPin(userId, workspaceSlug, tipId);
      if (result === "max_reached") {
        syncFromStorage();
      }
      return result;
    },
    [userId, workspaceSlug, syncFromStorage],
  );

  const dismissTip = useCallback(
    (tipId: TipId) => {
      if (!userId) {
        return;
      }

      setSnapshot((current) => {
        if (current.pinnedIds.includes(tipId) || current.dismissedIds.includes(tipId)) {
          return current;
        }
        return {
          ...current,
          dismissedIds: [...current.dismissedIds, tipId],
        };
      });

      dismissTipForUser(userId, workspaceSlug, tipId);
    },
    [userId, workspaceSlug],
  );

  return {
    ...snapshot,
    hasHydrated,
    refreshTipsStorage: syncFromStorage,
    togglePin,
    dismissTip,
  };
}
