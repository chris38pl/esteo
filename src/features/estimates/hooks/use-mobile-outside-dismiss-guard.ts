"use client";

import { useEffect, useRef, type RefObject } from "react";

import type { EstimateWorkflowDialogAction } from "@/features/estimates/components/estimate-workflow-dialog";

export const MOBILE_OUTSIDE_DISMISS_GUARD_MS = 450;

export function useIgnoreInitialOutsideDismiss(open: boolean) {
  const ignoreRef = useRef(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    ignoreRef.current = true;
    const timer = window.setTimeout(() => {
      ignoreRef.current = false;
    }, MOBILE_OUTSIDE_DISMISS_GUARD_MS);

    return () => {
      window.clearTimeout(timer);
      ignoreRef.current = false;
    };
  }, [open]);

  return ignoreRef;
}

export function getMobileSheetOutsideDismissHandlers(
  ignoreRef: RefObject<boolean>,
) {
  return {
    onPointerDownOutside: (event: Event) => {
      if (ignoreRef.current) {
        event.preventDefault();
      }
    },
    onInteractOutside: (event: Event) => {
      if (ignoreRef.current) {
        event.preventDefault();
      }
    },
    onFocusOutside: (event: Event) => {
      if (ignoreRef.current) {
        event.preventDefault();
      }
    },
  };
}

export function openEstimateWorkflowDialogDeferred(
  open: (action: EstimateWorkflowDialogAction) => void,
  action: EstimateWorkflowDialogAction,
) {
  window.setTimeout(() => open(action), MOBILE_OUTSIDE_DISMISS_GUARD_MS / 3);
}

export function createMobileDismissGuardedOpenChange(
  ignoreRef: RefObject<boolean>,
  onOpenChange: (open: boolean) => void,
) {
  return (nextOpen: boolean) => {
    if (!nextOpen && ignoreRef.current) {
      return;
    }
    onOpenChange(nextOpen);
  };
}
