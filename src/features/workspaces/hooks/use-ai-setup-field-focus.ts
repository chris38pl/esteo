"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import {
  AI_SETUP_FOCUS_FIELD_IDS,
  AI_SETUP_FOCUS_PARAM,
  isAiSetupFocusField,
} from "@/features/workspaces/lib/ai-setup-focus";

const HIGHLIGHT_CLASS = "ai-setup-focus-active";
const HIGHLIGHT_MS = 4_000;

function findFocusTarget(focus: keyof typeof AI_SETUP_FOCUS_FIELD_IDS): HTMLElement | null {
  const id = AI_SETUP_FOCUS_FIELD_IDS[focus];
  const byId = document.getElementById(id);
  if (byId) {
    return byId;
  }
  return document.querySelector<HTMLElement>(`[data-ai-setup-field="${focus}"]`);
}

function focusWithinTarget(target: HTMLElement) {
  const focusable =
    target.matches("input, textarea, button, select")
      ? target
      : target.querySelector<HTMLElement>("input, textarea, button, select");

  focusable?.focus({ preventScroll: true });
}

export function useAiSetupFieldFocus() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const focusParam = searchParams.get(AI_SETUP_FOCUS_PARAM);

  useEffect(() => {
    if (!isAiSetupFocusField(focusParam)) {
      return;
    }

    let removeHighlightTimer: number | undefined;

    const applyTimer = window.setTimeout(() => {
      const target = findFocusTarget(focusParam);
      if (!target) {
        return;
      }

      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add(HIGHLIGHT_CLASS);
      focusWithinTarget(target);

      removeHighlightTimer = window.setTimeout(() => {
        target.classList.remove(HIGHLIGHT_CLASS);
      }, HIGHLIGHT_MS);

      const params = new URLSearchParams(searchParams.toString());
      params.delete(AI_SETUP_FOCUS_PARAM);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 150);

    return () => {
      window.clearTimeout(applyTimer);
      if (removeHighlightTimer) {
        window.clearTimeout(removeHighlightTimer);
      }
    };
  }, [focusParam, pathname, router, searchParams]);
}
