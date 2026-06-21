"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  isCelebrationDismissed,
  isFormLinkCopied,
  isWorkspaceReadyBannerVisible,
} from "@/features/activation/lib/activation-storage";
import type {
  ActivationGuideMode,
  ActivationProgressClient,
  ActivationStep,
} from "@/features/activation/lib/activation-types";
import { isTipsBannerDismissedForSession } from "@/features/tips/lib/tips-storage";

export function mergeActivationProgressWithClientState(
  serverProgress: ActivationProgressClient,
  workspaceSlug: string,
  options?: { readClientStorage?: boolean; userId?: string | null },
): {
  steps: ActivationStep[];
  completedCount: number;
  isComplete: boolean;
  isCelebrating: boolean;
  showChecklist: boolean;
  guideMode: ActivationGuideMode;
  formLinkCopied: boolean;
  isWorkspaceReadyBannerVisible: boolean;
  isCelebrationDismissed: boolean;
  isTipsBannerDismissed: boolean;
  showTipsBanner: boolean;
} {
  const readClientStorage = options?.readClientStorage ?? true;
  const userId = options?.userId ?? null;

  const formLinkCopied = readClientStorage
    ? isFormLinkCopied(workspaceSlug)
    : false;
  const celebrationDismissed = readClientStorage
    ? isCelebrationDismissed(workspaceSlug)
    : false;
  const tipsBannerDismissed =
    readClientStorage && userId
      ? isTipsBannerDismissedForSession(userId, workspaceSlug)
      : false;
  const bannerVisible = readClientStorage
    ? isWorkspaceReadyBannerVisible(workspaceSlug)
    : false;

  const steps = serverProgress.steps.map((step) =>
    step.id === "share_form"
      ? { ...step, completed: step.completed || formLinkCopied }
      : step,
  );

  const completedCount = steps.filter((step) => step.completed).length;
  const isComplete = completedCount >= serverProgress.totalCount;
  const isCelebrating = isComplete && !celebrationDismissed;

  const guideMode: ActivationGuideMode =
    isComplete && celebrationDismissed ? "tips" : "how_it_works";

  const showTipsBanner =
    serverProgress.eligible && guideMode === "tips" && !tipsBannerDismissed;

  const showChecklist =
    serverProgress.eligible &&
    !bannerVisible &&
    (!isComplete || isCelebrating);

  return {
    steps,
    completedCount,
    isComplete,
    isCelebrating,
    showChecklist,
    guideMode,
    formLinkCopied,
    isWorkspaceReadyBannerVisible: bannerVisible,
    isCelebrationDismissed: celebrationDismissed,
    isTipsBannerDismissed: tipsBannerDismissed,
    showTipsBanner,
  };
}

export function useActivationUiState(
  serverProgress: ActivationProgressClient,
  workspaceSlug: string,
  userId: string,
) {
  const [revision, setRevision] = useState(0);
  const [hasHydrated, setHasHydrated] = useState(false);

  const bump = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key?.includes(workspaceSlug) && event.key.includes(userId)) {
        bump();
      }
    };
    const onActivationChange = (event: Event) => {
      const detail = (event as CustomEvent<{ workspaceSlug?: string }>).detail;
      if (detail?.workspaceSlug === workspaceSlug) {
        bump();
      }
    };
    const onTipsChange = (event: Event) => {
      const detail = (event as CustomEvent<{ workspaceSlug?: string; userId?: string }>).detail;
      if (detail?.workspaceSlug === workspaceSlug && detail?.userId === userId) {
        bump();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("esteo:activation-storage-changed", onActivationChange);
    window.addEventListener("esteo:tips-storage-changed", onTipsChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("esteo:activation-storage-changed", onActivationChange);
      window.removeEventListener("esteo:tips-storage-changed", onTipsChange);
    };
  }, [workspaceSlug, userId, bump, hasHydrated]);

  const state = useMemo(
    () =>
      mergeActivationProgressWithClientState(serverProgress, workspaceSlug, {
        readClientStorage: hasHydrated,
        userId,
      }),
    [serverProgress, workspaceSlug, revision, hasHydrated, userId],
  );

  return { ...state, hasHydrated, refreshActivationUi: bump };
}
