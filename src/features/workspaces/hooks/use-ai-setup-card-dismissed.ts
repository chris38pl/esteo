"use client";

import { useCallback, useEffect, useState } from "react";

import {
  dismissAiSetupCard,
  isAiSetupCardDismissed,
} from "@/features/workspaces/lib/ai-setup-card-storage";

export function useAiSetupCardDismissed(userId: string | null, workspaceSlug: string) {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const syncFromStorage = useCallback(() => {
    if (!userId) {
      setIsDismissed(false);
      return;
    }
    setIsDismissed(isAiSetupCardDismissed(userId, workspaceSlug));
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

    const onDismissed = (event: Event) => {
      const detail = (event as CustomEvent<{ workspaceSlug?: string; userId?: string }>).detail;
      if (detail?.workspaceSlug === workspaceSlug && detail?.userId === userId) {
        syncFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("esteo:ai-setup-card-dismissed", onDismissed);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("esteo:ai-setup-card-dismissed", onDismissed);
    };
  }, [hasHydrated, syncFromStorage, userId, workspaceSlug]);

  const dismiss = useCallback(() => {
    if (!userId) {
      return;
    }
    setIsDismissed(true);
    dismissAiSetupCard(userId, workspaceSlug);
  }, [userId, workspaceSlug]);

  return {
    hasHydrated,
    isDismissed,
    dismiss,
  };
}
