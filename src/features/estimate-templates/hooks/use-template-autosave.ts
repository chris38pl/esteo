"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SAVED_DISPLAY_MS } from "@/features/estimates/lib/estimate-layout-config";

export type TemplateAutoSaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 1500;

export function useTemplateAutosave({
  enabled,
  canSave,
  getCanSave,
  onSave,
}: {
  enabled: boolean;
  canSave: boolean;
  /** When provided, evaluated at save time instead of the render-time `canSave` flag. */
  getCanSave?: () => boolean;
  onSave: () => Promise<boolean>;
}) {
  const [status, setStatus] = useState<TemplateAutoSaveStatus>("idle");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistInFlightRef = useRef(false);
  const pendingRef = useRef(false);

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const isSavable = useCallback(() => getCanSave?.() ?? canSave, [canSave, getCanSave]);

  const persist = useCallback(async () => {
    if (!enabled || !isSavable() || persistInFlightRef.current) {
      pendingRef.current = !persistInFlightRef.current;
      return;
    }

    persistInFlightRef.current = true;
    setStatus("saving");

    const success = await onSave().catch(() => false);

    persistInFlightRef.current = false;

    if (success) {
      setStatus("saved");
      const timer = setTimeout(() => setStatus("idle"), SAVED_DISPLAY_MS);
      return () => clearTimeout(timer);
    }

    setStatus("error");
    return undefined;
  }, [enabled, isSavable, onSave]);

  const scheduleSave = useCallback(() => {
    if (!enabled) return;
    clearDebounce();
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void persist();
    }, DEBOUNCE_MS);
  }, [clearDebounce, enabled, persist]);

  const saveNow = useCallback(async () => {
    clearDebounce();
    await persist();
    if (pendingRef.current) {
      pendingRef.current = false;
      await persist();
    }
  }, [clearDebounce, persist]);

  useEffect(() => () => clearDebounce(), [clearDebounce]);

  return { status, scheduleSave, saveNow };
}
