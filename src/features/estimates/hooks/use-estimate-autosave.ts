"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SAVED_DISPLAY_MS } from "@/features/estimates/lib/estimate-layout-config";
import { autoSaveAction } from "@/features/estimates/server/actions";
import type { AutoSaveData } from "@/features/estimates/server/repository";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error" | "conflict";

export interface UseEstimateAutosaveOptions {
  versionId: string;
  workspaceId: string;
  initialUpdatedAt: string;
  locale?: string;
  enabled?: boolean;
}

export interface UseEstimateAutosaveReturn {
  status: AutoSaveStatus;
  save: (data: AutoSaveData) => void;
  onBlur: (data: AutoSaveData) => void;
}

const DEBOUNCE_MS = 3000;

export function useEstimateAutosave({
  versionId,
  workspaceId,
  initialUpdatedAt,
  locale = "pl",
  enabled = true,
}: UseEstimateAutosaveOptions): UseEstimateAutosaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const updatedAtRef = useRef<string>(initialUpdatedAt);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<AutoSaveData | null>(null);

  useEffect(() => {
    updatedAtRef.current = initialUpdatedAt;
  }, [initialUpdatedAt]);

  const persist = useCallback(
    async (data: AutoSaveData) => {
      if (!enabled || status === "conflict") return;

      setStatus("saving");

      try {
        const result = await autoSaveAction({
          versionId,
          workspaceId,
          data,
          expectedUpdatedAt: updatedAtRef.current,
          locale: locale as "pl" | "en",
        });

        if (!result.success) {
          setStatus("error");
          return;
        }

        if (result.data.conflict) {
          setStatus("conflict");
          return;
        }

        updatedAtRef.current = result.data.updatedAt;
        pendingDataRef.current = null;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [versionId, workspaceId, locale, status, enabled],
  );

  const onBlur = useCallback(
    (data: AutoSaveData) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      pendingDataRef.current = null;
      void persist(data);
    },
    [persist],
  );

  const save = useCallback(
    (data: AutoSaveData) => {
      if (status === "conflict") return;

      pendingDataRef.current = data;
      setStatus("saving");

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (pendingDataRef.current) {
          void persist(pendingDataRef.current);
        }
      }, DEBOUNCE_MS);
    },
    [status, persist],
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (status !== "saved") return;
    const timer = setTimeout(() => setStatus("idle"), SAVED_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [status]);

  return { status, save, onBlur };
}
