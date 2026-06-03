"use client";

import { useEffect, useRef, useState } from "react";

import { getGenerationStatusAction } from "@/features/estimates/server/actions";
import type { Locale } from "@/lib/locale";

export type GenerationStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | null;

interface UseGenerationPollingOptions {
  estimateId: string;
  initialStatus: GenerationStatus;
  locale?: Locale;
  /** Called when the status changes to COMPLETED or FAILED */
  onFinished?: (status: "COMPLETED" | "FAILED") => void;
}

const TIMEOUT_MS = 5 * 60 * 1000;

function getIntervalMs(elapsedMs: number): number {
  if (elapsedMs < 10_000) return 2_000;
  if (elapsedMs < 30_000) return 5_000;
  return 10_000;
}

export function useGenerationPolling({
  estimateId,
  initialStatus,
  locale = "pl",
  onFinished,
}: UseGenerationPollingOptions) {
  const [status, setStatus] = useState<GenerationStatus>(initialStatus);
  const [timedOut, setTimedOut] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const isTerminal =
    status === "COMPLETED" || status === "FAILED" || timedOut;

  useEffect(() => {
    if (isTerminal) return;

    startTimeRef.current = Date.now();

    const poll = async () => {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed >= TIMEOUT_MS) {
        setTimedOut(true);
        return;
      }

      try {
        const result = await getGenerationStatusAction(estimateId, locale);

        if (result.success) {
          const newStatus = result.data.requestStatus as GenerationStatus;
          setStatus(newStatus);

          if (newStatus === "COMPLETED" || newStatus === "FAILED") {
            onFinishedRef.current?.(newStatus);
            return;
          }
        }
      } catch {
        // Polling errors are non-fatal — keep trying
      }

      const interval = getIntervalMs(Date.now() - startTimeRef.current);
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

  return { status, timedOut };
}
