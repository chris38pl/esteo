"use client";

import { useEffect, useState } from "react";

import {
  ESTIMATE_LAYOUT_CONFIG,
  mediaQueryMin,
} from "@/features/estimates/lib/estimate-layout-config";

/** True when the Reguły zastosowane label is shown (not icon-only). */
export function useEstimateRulesLabelVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(
      mediaQueryMin(ESTIMATE_LAYOUT_CONFIG.breakpoints.headerRulesLabel),
    );
    const update = () => setVisible(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return visible;
}
