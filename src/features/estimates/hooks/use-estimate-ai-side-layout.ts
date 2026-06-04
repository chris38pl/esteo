"use client";

import { useEffect, useState } from "react";

import {
  ESTIMATE_LAYOUT_CONFIG,
  mediaQueryMin,
} from "@/features/estimates/lib/estimate-layout-config";

/** True when viewport uses the side-column AI layout (not floating FAB). */
export function useEstimateAiSideLayout(): boolean {
  const [isSideLayout, setIsSideLayout] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(
      mediaQueryMin(ESTIMATE_LAYOUT_CONFIG.breakpoints.aiSideLayout),
    );
    const update = () => setIsSideLayout(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isSideLayout;
}
