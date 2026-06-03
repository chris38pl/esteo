"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { autoSaveAction } from "@/features/estimates/server/actions";
import type { AutoSaveData } from "@/features/estimates/server/repository";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error" | "conflict";

export interface UseEstimateAutosaveOptions {
  versionId: string;
  workspaceId: string;
  initialUpdatedAt: string;
  locale?: string;
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
      if (status === "conflict") return;

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
    [versionId, workspaceId, locale, status],
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

  return { status, save, onBlur };
}
