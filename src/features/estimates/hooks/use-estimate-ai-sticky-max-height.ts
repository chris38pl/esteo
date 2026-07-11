"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";

const BOTTOM_GAP_PX = 16;

/**
 * Side-column AI max height from its document position (below header + top-band).
 * Measured only at layout/resize - not on scroll (avoids sticky stretch bugs at page bottom).
 */
export function useEstimateAiStickyMaxHeight(
  anchorRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): number | undefined {
  const [maxHeight, setMaxHeight] = useState<number | undefined>();
  const naturalTopRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!enabled) {
      naturalTopRef.current = null;
      setMaxHeight(undefined);
      return;
    }

    const anchor = anchorRef.current;
    if (!anchor) return;

    const applyMaxHeight = (topFromDocument: number) => {
      naturalTopRef.current = topFromDocument;
      setMaxHeight(
        Math.max(280, window.innerHeight - topFromDocument - BOTTOM_GAP_PX),
      );
    };

    const measureLayoutTop = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      applyMaxHeight(rect.top + window.scrollY);
    };

    const measure = (allowWhileScrolled = false) => {
      if (!allowWhileScrolled && window.scrollY > 4 && naturalTopRef.current != null) {
        setMaxHeight(
          Math.max(280, window.innerHeight - naturalTopRef.current - BOTTOM_GAP_PX),
        );
        return;
      }
      measureLayoutTop();
    };

    const raf = requestAnimationFrame(() => measure(true));

    const ro = new ResizeObserver(() => measure(false));
    ro.observe(anchor);
    const grid = anchor.closest(".estimate-editor-ai-grid");
    if (grid instanceof HTMLElement) {
      ro.observe(grid);
    }
    const topBand = anchor.closest(".estimate-editor")?.querySelector(".estimate-top-band");
    if (topBand instanceof HTMLElement) {
      ro.observe(topBand);
    }

    const onResize = () => measure(true);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [anchorRef, enabled]);

  return maxHeight;
}
