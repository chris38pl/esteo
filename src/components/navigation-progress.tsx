"use client";

import { useReducedMotion } from "framer-motion";
import NextTopLoader from "nextjs-toploader";

export function NavigationProgress() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <NextTopLoader
      color="var(--primary)"
      height={3}
      showSpinner={false}
      zIndex={35}
      shadow={false}
      crawlSpeed={200}
      speed={400}
    />
  );
}
