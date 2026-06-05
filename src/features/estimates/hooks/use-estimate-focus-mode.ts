"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "esteo-estimate-top-panel-hidden";

export function useEstimateFocusMode() {
  const [topPanelHidden, setTopPanelHiddenState] = useState(false);

  useEffect(() => {
    try {
      setTopPanelHiddenState(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTopPanel = useCallback(() => {
    setTopPanelHiddenState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { topPanelHidden, toggleTopPanel };
}
