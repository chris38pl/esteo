"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SAVED_DISPLAY_MS } from "@/features/estimates/lib/estimate-layout-config";
import {
  autoSaveAction,
  getVersionUpdatedAtAction,
} from "@/features/estimates/server/actions";
import type { AutoSaveData } from "@/features/estimates/server/repository";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error" | "conflict";

export interface UseEstimateAutosaveOptions {
  versionId: string;
  workspaceId: string;
  initialUpdatedAt: string;
  locale?: string;
  enabled?: boolean;
  onPersistStart?: () => void;
  onPersisted?: (updatedAt: string, meta: { isQueueIdle: boolean }) => void;
  onPersistError?: () => void;
}

export interface UseEstimateAutosaveReturn {
  status: AutoSaveStatus;
  save: (data: AutoSaveData) => void;
  onBlur: (data: AutoSaveData) => Promise<void>;
  isQueueIdle: () => boolean;
}

const DEBOUNCE_MS = 3000;

export function useEstimateAutosave({
  versionId,
  workspaceId,
  initialUpdatedAt,
  locale = "pl",
  enabled = true,
  onPersistStart,
  onPersisted,
  onPersistError,
}: UseEstimateAutosaveOptions): UseEstimateAutosaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const updatedAtRef = useRef<string>(initialUpdatedAt);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<AutoSaveData | null>(null);
  const queuedPayloadRef = useRef<AutoSaveData | null>(null);
  const persistInFlightRef = useRef(false);
  const drainPromiseRef = useRef<Promise<void> | null>(null);
  const statusRef = useRef<AutoSaveStatus>("idle");

  useEffect(() => {
    if (!persistInFlightRef.current) {
      updatedAtRef.current = initialUpdatedAt;
    }
  }, [initialUpdatedAt]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const isQueueIdle = useCallback(() => {
    return (
      !persistInFlightRef.current &&
      queuedPayloadRef.current === null &&
      debounceTimerRef.current === null
    );
  }, []);

  const persistOnce = useCallback(
    async (data: AutoSaveData, allowConflictRetry: boolean): Promise<"success" | "conflict" | "error"> => {
      const result = await autoSaveAction({
        versionId,
        workspaceId,
        data,
        expectedUpdatedAt: updatedAtRef.current,
        locale: locale as "pl" | "en",
      });

      if (!result.success) {
        return "error";
      }

      if (!result.data.conflict) {
        updatedAtRef.current = result.data.updatedAt;
        return "success";
      }

      if (!allowConflictRetry) {
        return "conflict";
      }

      const fresh = await getVersionUpdatedAtAction({
        versionId,
        workspaceId,
        locale: locale as "pl" | "en",
      });

      if (!fresh.success) {
        return "conflict";
      }

      updatedAtRef.current = fresh.data.updatedAt;

      const retry = await autoSaveAction({
        versionId,
        workspaceId,
        data,
        expectedUpdatedAt: updatedAtRef.current,
        locale: locale as "pl" | "en",
      });

      if (!retry.success) {
        return "error";
      }

      if (retry.data.conflict) {
        return "conflict";
      }

      updatedAtRef.current = retry.data.updatedAt;
      return "success";
    },
    [versionId, workspaceId, locale],
  );

  const drainPersistQueue = useCallback(async (): Promise<void> => {
    if (persistInFlightRef.current) {
      return drainPromiseRef.current ?? Promise.resolve();
    }

    if (!enabled || statusRef.current === "conflict") {
      return Promise.resolve();
    }

    persistInFlightRef.current = true;
    onPersistStart?.();
    setStatus("saving");

    const run = async () => {
      let completedSuccessfully = false;

      try {
        while (queuedPayloadRef.current) {
          const data = queuedPayloadRef.current;
          queuedPayloadRef.current = null;

          const outcome = await persistOnce(data, true);

          if (outcome === "error") {
            setStatus("error");
            onPersistError?.();
            return;
          }

          if (outcome === "conflict") {
            setStatus("conflict");
            onPersistError?.();
            return;
          }
        }

        setStatus("saved");
        completedSuccessfully = true;
      } catch {
        setStatus("error");
        onPersistError?.();
      } finally {
        persistInFlightRef.current = false;
        drainPromiseRef.current = null;

        if (queuedPayloadRef.current && statusRef.current !== "conflict") {
          void drainPersistQueue();
        } else if (completedSuccessfully) {
          onPersisted?.(updatedAtRef.current, {
            isQueueIdle: debounceTimerRef.current === null,
          });
        }
      }
    };

    drainPromiseRef.current = run();
    return drainPromiseRef.current;
  }, [enabled, onPersistStart, onPersisted, onPersistError, persistOnce]);

  const enqueuePersist = useCallback(
    (data: AutoSaveData): Promise<void> => {
      if (!enabled || statusRef.current === "conflict") {
        return Promise.resolve();
      }

      queuedPayloadRef.current = data;
      return drainPersistQueue();
    },
    [enabled, drainPersistQueue],
  );

  const onBlur = useCallback(
    (data: AutoSaveData) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      pendingDataRef.current = null;
      return enqueuePersist(data);
    },
    [enqueuePersist],
  );

  const save = useCallback(
    (data: AutoSaveData) => {
      if (statusRef.current === "conflict") return;

      pendingDataRef.current = data;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        const latest = pendingDataRef.current;
        pendingDataRef.current = null;
        if (latest) {
          void enqueuePersist(latest);
        }
      }, DEBOUNCE_MS);
    },
    [enqueuePersist],
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

  return { status, save, onBlur, isQueueIdle };
}
