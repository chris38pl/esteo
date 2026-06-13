"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";

import {
  formatDecimalInputDisplay,
  formatPercentInputDisplay,
  isValidDecimalDraft,
  parseDecimalInput,
  roundDecimal,
} from "@/lib/decimal-input";
import { cn } from "@/lib/utils";

import { Input } from "./input";

type DecimalInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: number;
  onValueChange: (value: number) => void;
  onBlurCommit?: () => void;
  emptyZero?: boolean;
  decimalPlaces?: number;
  min?: number;
  max?: number;
};

function clampDecimal(
  value: number,
  options: { min?: number; max?: number; decimalPlaces: number },
): number {
  let result = roundDecimal(value, options.decimalPlaces);
  if (options.min !== undefined) {
    result = Math.max(options.min, result);
  }
  if (options.max !== undefined) {
    result = Math.min(options.max, result);
  }
  return result;
}

export function DecimalInput({
  value,
  onValueChange,
  onBlurCommit,
  emptyZero = true,
  decimalPlaces = 2,
  min,
  max,
  className,
  onFocus,
  onBlur,
  ...props
}: DecimalInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(null);
    }
  }, [value]);

  const display =
    draft !== null
      ? draft
      : formatDecimalInputDisplay(value, { emptyZero, maxPlaces: decimalPlaces });

  const clampOptions = { min, max, decimalPlaces };

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={display}
      className={cn(className)}
      onFocus={(event) => {
        isFocusedRef.current = true;
        setDraft(formatDecimalInputDisplay(value, { emptyZero, maxPlaces: decimalPlaces }));
        event.target.select();
        onFocus?.(event);
      }}
      onChange={(event) => {
        const raw = event.target.value;
        if (!isValidDecimalDraft(raw)) {
          return;
        }

        setDraft(raw);

        if (raw === "" || raw === "." || raw === ",") {
          onValueChange(clampDecimal(0, clampOptions));
          return;
        }

        onValueChange(clampDecimal(parseDecimalInput(raw, decimalPlaces), clampOptions));
      }}
      onBlur={(event) => {
        isFocusedRef.current = false;
        const committed = clampDecimal(
          parseDecimalInput(draft ?? display, decimalPlaces),
          clampOptions,
        );
        onValueChange(committed);
        setDraft(null);
        onBlurCommit?.();
        onBlur?.(event);
      }}
    />
  );
}

type PercentInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: number;
  onValueChange: (value: number) => void;
  onBlurCommit?: () => void;
  emptyZero?: boolean;
  min?: number;
  max?: number;
};

export function PercentInput({
  value,
  onValueChange,
  onBlurCommit,
  emptyZero = true,
  min = 0,
  max = 100,
  className,
  onFocus,
  onBlur,
  ...props
}: PercentInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(null);
    }
  }, [value]);

  const display = draft !== null ? draft : formatPercentInputDisplay(value, { emptyZero });

  const clampPercent = (percent: number) => {
    let result = roundDecimal(percent, 0);
    result = Math.max(min, result);
    result = Math.min(max, result);
    return result;
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={display}
      className={cn(className)}
      onFocus={(event) => {
        isFocusedRef.current = true;
        setDraft(formatPercentInputDisplay(value, { emptyZero }));
        event.target.select();
        onFocus?.(event);
      }}
      onChange={(event) => {
        const raw = event.target.value;
        if (!isValidDecimalDraft(raw)) {
          return;
        }

        setDraft(raw);

        if (raw === "" || raw === "." || raw === ",") {
          onValueChange(clampPercent(0) / 100);
          return;
        }

        onValueChange(clampPercent(parseDecimalInput(raw, 0)) / 100);
      }}
      onBlur={(event) => {
        isFocusedRef.current = false;
        const committed = clampPercent(parseDecimalInput(draft ?? display, 0));
        onValueChange(committed / 100);
        setDraft(null);
        onBlurCommit?.();
        onBlur?.(event);
      }}
    />
  );
}

export function DecimalFieldInput({
  value,
  onChange,
  ...props
}: Omit<DecimalInputProps, "value" | "onValueChange"> & {
  value: string | number;
  onChange: (value: string | number) => void;
}) {
  const numericValue = typeof value === "number" ? value : 0;

  return (
    <DecimalInput
      {...props}
      value={numericValue}
      onValueChange={(next) => onChange(next === 0 ? "" : next)}
    />
  );
}
