"use client";

import { useEffect, useState } from "react";

/** Bottom inset when the virtual keyboard shrinks the visual viewport (Android Chrome). */
export function useMobileKeyboardViewportInset(enabled: boolean): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setInset(0);
      return;
    }

    const activeViewport = window.visualViewport;
    if (!activeViewport) {
      return;
    }

    function updateInset() {
      const viewport = window.visualViewport;
      if (!viewport) {
        setInset(0);
        return;
      }

      setInset(
        Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop),
      );
    }

    updateInset();
    activeViewport.addEventListener("resize", updateInset);
    activeViewport.addEventListener("scroll", updateInset);

    return () => {
      activeViewport.removeEventListener("resize", updateInset);
      activeViewport.removeEventListener("scroll", updateInset);
      setInset(0);
    };
  }, [enabled]);

  return inset;
}
