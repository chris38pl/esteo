"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import {
  AI_SETUP_FOCUS_PARAM,
  applyAiSetupFieldFocus,
  findAiSetupFocusTarget,
  isAiSetupFocusField,
  type AiSetupFocusField,
} from "@/features/workspaces/lib/ai-setup-focus";

const FOCUS_RETRY_MS = 100;
const FOCUS_MAX_ATTEMPTS = 20;

function tryApplyFocus(focus: AiSetupFocusField, attempt = 0): void {
  if (applyAiSetupFieldFocus(focus)) {
    return;
  }

  if (attempt >= FOCUS_MAX_ATTEMPTS) {
    return;
  }

  window.setTimeout(() => {
    tryApplyFocus(focus, attempt + 1);
  }, FOCUS_RETRY_MS);
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

    const focus = focusParam;
    const applyTimer = window.setTimeout(() => {
      tryApplyFocus(focus);

      const params = new URLSearchParams(searchParams.toString());
      params.delete(AI_SETUP_FOCUS_PARAM);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 150);

    return () => {
      window.clearTimeout(applyTimer);
    };
  }, [focusParam, pathname, router, searchParams]);
}

export function scrollToAiSetupFieldOnPage(focus: AiSetupFocusField): boolean {
  if (!findAiSetupFocusTarget(focus)) {
    return false;
  }
  applyAiSetupFieldFocus(focus);
  return true;
}

export function isConfigurationRulesPath(pathname: string, tab: string | null): boolean {
  if (!pathname.includes("/configuration")) {
    return false;
  }
  return tab === "rules" || tab === null;
}
