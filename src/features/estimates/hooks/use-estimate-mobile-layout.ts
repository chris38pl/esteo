"use client";

import { useEffect, useState } from "react";

import {
  ESTIMATE_LAYOUT_CONFIG,
  mediaQueryMax,
} from "@/features/estimates/lib/estimate-layout-config";

function readIsMobileLayout(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia(
    mediaQueryMax(ESTIMATE_LAYOUT_CONFIG.breakpoints.headerActionsDivider - 1),
  ).matches;
}

/** True below the estimate editor mobile breakpoint (card list + sticky bar). */
export function useEstimateMobileLayout(): boolean {
  const [isMobile, setIsMobile] = useState(readIsMobileLayout);

  useEffect(() => {
    const mq = window.matchMedia(
      mediaQueryMax(ESTIMATE_LAYOUT_CONFIG.breakpoints.headerActionsDivider - 1),
    );
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}
