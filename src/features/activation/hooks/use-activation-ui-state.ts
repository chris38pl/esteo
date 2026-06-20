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

export function mergeActivationProgressWithClientState(
  serverProgress: ActivationProgressClient,
  workspaceSlug: string,
  options?: { readClientStorage?: boolean },
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
} {
  const readClientStorage = options?.readClientStorage ?? true;

  const formLinkCopied = readClientStorage
    ? isFormLinkCopied(workspaceSlug)
    : false;
  const celebrationDismissed = readClientStorage
    ? isCelebrationDismissed(workspaceSlug)
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
  };
}

export function useActivationUiState(
  serverProgress: ActivationProgressClient,
  workspaceSlug: string,
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
      if (event.key?.includes(workspaceSlug)) {
        bump();
      }
    };
    const onLocalChange = (event: Event) => {
      const detail = (event as CustomEvent<{ workspaceSlug?: string }>).detail;
      if (detail?.workspaceSlug === workspaceSlug) {
        bump();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("esteo:activation-storage-changed", onLocalChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("esteo:activation-storage-changed", onLocalChange);
    };
  }, [workspaceSlug, bump, hasHydrated]);

  const state = useMemo(
    () =>
      mergeActivationProgressWithClientState(serverProgress, workspaceSlug, {
        readClientStorage: hasHydrated,
      }),
    [serverProgress, workspaceSlug, revision, hasHydrated],
  );

  return { ...state, hasHydrated, refreshActivationUi: bump };
}
