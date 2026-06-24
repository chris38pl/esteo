"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "esteo-template-advanced-mode";

export function useTemplateAdvancedMode() {
  const [advancedMode, setAdvancedModeState] = useState(false);

  useEffect(() => {
    try {
      setAdvancedModeState(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      /* ignore */
    }
  }, []);

  const setAdvancedMode = useCallback((value: boolean) => {
    setAdvancedModeState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* ignore */
    }
  }, []);

  return { advancedMode, setAdvancedMode };
}
