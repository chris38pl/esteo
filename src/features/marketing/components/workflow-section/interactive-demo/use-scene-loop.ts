"use client";

import { useEffect, useRef, useState } from "react";

export function useSceneLoop(
  phaseCount: number,
  phaseDurationsMs: readonly number[],
  options?: { reducedMotion?: boolean | null; cyclePauseMs?: number; loop?: boolean },
) {
  const reducedMotion = options?.reducedMotion ?? false;
  const cyclePauseMs = options?.cyclePauseMs ?? 400;
  const loop = options?.loop ?? true;
  const [phase, setPhase] = useState(0);
  const durationsRef = useRef(phaseDurationsMs);
  durationsRef.current = phaseDurationsMs;

  useEffect(() => {
    if (reducedMotion) {
      setPhase(phaseCount - 1);
      return;
    }

    let cancelled = false;
    const timeouts: number[] = [];

    const runCycle = () => {
      if (cancelled) {
        return;
      }

      setPhase(0);
      let elapsed = 0;
      const durations = durationsRef.current;

      for (let index = 1; index < phaseCount; index += 1) {
        elapsed += durations[index - 1] ?? 600;
        timeouts.push(
          window.setTimeout(() => {
            if (!cancelled) {
              setPhase(index);
            }
          }, elapsed),
        );
      }

      if (loop) {
        const cycleDuration =
          durations.reduce((sum, value) => sum + value, 0) + cyclePauseMs;

        timeouts.push(window.setTimeout(runCycle, cycleDuration));
      }
    };

    runCycle();

    return () => {
      cancelled = true;
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [cyclePauseMs, loop, phaseCount, reducedMotion]);

  return phase;
}
