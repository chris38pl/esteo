"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

/** Above EstimateAiFloating (`z-[70]`) and estimate sheets (`z-[80]`), below Sonner toasts (`z-[90]`). */
const NAVIGATION_OVERLAY_Z_CLASS = "z-[85]";

export function EstimateNavigationOverlay({
  label,
  hint,
}: {
  label: string;
  hint?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const overlay = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`fixed inset-0 ${NAVIGATION_OVERLAY_Z_CLASS} flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm`}
    >
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-foreground">{label}</p>
      {hint ? (
        <p className="max-w-xs text-center text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(overlay, document.body);
}
