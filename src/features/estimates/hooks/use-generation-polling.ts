"use client";

import { useEffect, useRef, useState } from "react";

import { getGenerationStatusAction } from "@/features/estimates/server/actions";
import type { Locale } from "@/lib/locale";

export type GenerationStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | null;

interface UseGenerationPollingOptions {
  estimateId: string;
  initialStatus: GenerationStatus;
  initialCanManualRetry?: boolean;
  locale?: Locale;
  /** Called when the status changes to COMPLETED or FAILED */
  onFinished?: (status: "COMPLETED" | "FAILED") => void;
}

function getIntervalMs(elapsedMs: number): number {
  if (elapsedMs < 10_000) return 2_000;
  if (elapsedMs < 30_000) return 5_000;
  return 10_000;
}

export function useGenerationPolling({
  estimateId,
  initialStatus,
  initialCanManualRetry = false,
  locale = "pl",
  onFinished,
}: UseGenerationPollingOptions) {
  const [status, setStatus] = useState<GenerationStatus>(initialStatus);
  const [canManualRetry, setCanManualRetry] = useState(initialCanManualRetry);
  const [isStale, setIsStale] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const isTerminal = status === "COMPLETED" || status === "FAILED";
  const showRetry = canManualRetry || status === "FAILED";

  useEffect(() => {
    if (isTerminal) return;

    const startTime = Date.now();

    const poll = async () => {
      try {
        const result = await getGenerationStatusAction(estimateId, locale);

        if (result.success) {
          const newStatus = result.data.requestStatus as GenerationStatus;
          setStatus(newStatus);
          setIsStale(result.data.isStale);
          setCanManualRetry(result.data.canManualRetry);

          if (newStatus === "COMPLETED" || newStatus === "FAILED") {
            onFinishedRef.current?.(newStatus);
            return;
          }
        }
      } catch {
        // Polling errors are non-fatal - keep trying
      }

      const interval = getIntervalMs(Date.now() - startTime);
      timerRef.current = setTimeout(poll, interval);
    };

    const interval = getIntervalMs(0);
    timerRef.current = setTimeout(poll, interval);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [estimateId, locale, isTerminal]);

  return { status, canManualRetry, isStale, showRetry };
}
