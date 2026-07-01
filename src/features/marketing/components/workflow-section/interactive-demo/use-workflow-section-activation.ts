"use client";

import { useEffect, useRef, type RefObject } from "react";

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

function isDesktopViewport() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

export function useWorkflowSectionActivation({
  targetRef,
  onActivate,
  onAutoplayEnabledChange,
}: {
  targetRef: RefObject<HTMLElement | null>;
  onActivate: () => void;
  onAutoplayEnabledChange: (enabled: boolean) => void;
}) {
  const isActiveRef = useRef(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) {
      return;
    }

    const setAutoplay = (enabled: boolean) => {
      onAutoplayEnabledChange(enabled);
    };

    const desktopObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        if (entry.isIntersecting) {
          if (!isActiveRef.current) {
            isActiveRef.current = true;
            onActivate();
          }
          setAutoplay(true);
          return;
        }

        isActiveRef.current = false;
        setAutoplay(false);
      },
      {
        threshold: [0, 0.35, 0.55],
        rootMargin: "-18% 0px -18% 0px",
      },
    );

    const mobileObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        if (isDesktopViewport()) {
          return;
        }

        if (entry.isIntersecting && entry.intersectionRatio >= 0.28) {
          if (!isActiveRef.current) {
            isActiveRef.current = true;
            onActivate();
          }
          setAutoplay(true);
          return;
        }

        if (!entry.isIntersecting || entry.intersectionRatio < 0.12) {
          isActiveRef.current = false;
          setAutoplay(false);
        }
      },
      { threshold: [0.12, 0.28, 0.45] },
    );

    desktopObserver.observe(target);
    mobileObserver.observe(target);

    return () => {
      desktopObserver.disconnect();
      mobileObserver.disconnect();
      setAutoplay(false);
    };
  }, [onActivate, onAutoplayEnabledChange, targetRef]);
}
