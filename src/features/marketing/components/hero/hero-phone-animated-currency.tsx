"use client";

import { useEffect, useRef, useState } from "react";

import { formatHeroPhoneCurrency } from "@/features/marketing/components/hero/format-hero-phone-currency";
import { cn } from "@/lib/utils";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function HeroAnimatedCurrency({
  value,
  currency: _currency,
  locale: _locale,
  className,
  durationMs = 1200,
  countUpOnMount = false,
  highlightOnChange = false,
  fractionDigits: _fractionDigits = 0,
}: {
  value: number;
  currency: string;
  locale: string;
  className?: string;
  durationMs?: number;
  countUpOnMount?: boolean;
  highlightOnChange?: boolean;
  fractionDigits?: number;
}) {
  const [displayValue, setDisplayValue] = useState(() => (countUpOnMount ? 0 : value));
  const [isAnimating, setIsAnimating] = useState(false);
  const fromRef = useRef(countUpOnMount ? 0 : value);
  const mountCountUpDoneRef = useRef(!countUpOnMount);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    let from = fromRef.current;
    const to = value;

    if (countUpOnMount && !mountCountUpDoneRef.current) {
      mountCountUpDoneRef.current = true;
      from = 0;
      setDisplayValue(0);
    }

    if (from === to) {
      return;
    }

    const start = performance.now();
    setIsAnimating(true);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(progress);
      setDisplayValue(from + (to - from) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        setIsAnimating(false);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, durationMs, countUpOnMount]);

  return (
    <span
      className={cn(
        "tabular-nums transition-colors duration-300",
        highlightOnChange && isAnimating && "text-primary",
        className,
      )}
    >
      {formatHeroPhoneCurrency(displayValue)}
    </span>
  );
}
