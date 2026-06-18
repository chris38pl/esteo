"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  exportEstimatePdfAction,
  pollEstimatePdfExportAction,
} from "@/features/estimates/server/pdf-export-actions";
import {
  closeEstimatePdfWindow,
  openEstimatePdfFallback,
  openEstimatePdfPlaceholder,
  showEstimatePdfInWindow,
} from "@/features/estimates/lib/open-estimate-pdf-document";
import type { Locale } from "@/lib/locale";

import {
  ESTIMATE_ASYNC_TOAST_POSITION,
} from "@/features/estimates/lib/estimate-async-toast";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 60_000;

export type EstimatePdfOutputMode = "export" | "preview";

export type EstimatePdfBeforeExportResult =
  | { proceed: true }
  | { proceed: false; reason: "unsaved" | "cancelled" };

export type EstimatePdfOutputResult =
  | { ok: true }
  | { ok: false; message: string; cancelled?: boolean };

export type EstimatePdfReadyPayload = {
  url: string;
  fileName: string;
  viewerTitle: string;
};

export function useEstimatePdfOutput(input: {
  estimateId: string;
  versionId: string | null;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  mode: EstimatePdfOutputMode;
  onBeforeExport?: () => Promise<EstimatePdfBeforeExportResult>;
  onPreviewGenerationStarted?: () => void;
  onPreviewReady?: (payload: EstimatePdfReadyPayload) => void | Promise<void>;
}) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingToastIdRef = useRef<string | number | null>(null);
  const viewerWindowRef = useRef<Window | null>(null);
  const isMountedRef = useRef(true);
  const isExportMode = input.mode === "export";

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const dismissExportProgress = useCallback(() => {
    if (loadingToastIdRef.current != null) {
      toast.dismiss(loadingToastIdRef.current);
      loadingToastIdRef.current = null;
    }
  }, []);

  const showExportProgress = useCallback(() => {
    if (!isExportMode) {
      return;
    }

    dismissExportProgress();
    loadingToastIdRef.current = toast.loading(t("editor.pdfExport.generating"), {
      description: t("editor.pdfExport.generatingHint"),
      position: ESTIMATE_ASYNC_TOAST_POSITION,
      duration: Infinity,
    });
  }, [dismissExportProgress, isExportMode, t]);

  const clearViewerWindow = useCallback(() => {
    closeEstimatePdfWindow(viewerWindowRef.current);
    viewerWindowRef.current = null;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearPollTimer();
      dismissExportProgress();
      clearViewerWindow();
    };
  }, [clearPollTimer, clearViewerWindow, dismissExportProgress]);

  const showError = useCallback(
    (message: string) => {
      dismissExportProgress();
      clearViewerWindow();
      setError(message);

      if (isExportMode) {
        toast.error(message, { position: ESTIMATE_ASYNC_TOAST_POSITION });
      }
    },
    [clearViewerWindow, dismissExportProgress, isExportMode],
  );

  const handleExportReady = useCallback(
    async (payload: EstimatePdfReadyPayload) => {
      dismissExportProgress();

      const shown = await showEstimatePdfInWindow(viewerWindowRef.current, {
        url: payload.url,
        viewerTitle: payload.viewerTitle,
        fileName: payload.fileName,
        downloadLabel: t("editor.pdfPreview.download"),
      });

      if (!shown) {
        openEstimatePdfFallback(payload.url, payload.fileName);
        toast.info(t("editor.pdfExport.popupBlocked"), {
          position: ESTIMATE_ASYNC_TOAST_POSITION,
        });
      }

      viewerWindowRef.current = null;
      setTimeout(() => router.refresh(), 0);
    },
    [dismissExportProgress, router, t],
  );

  const handleReady = useCallback(
    async (payload: EstimatePdfReadyPayload) => {
      if (isExportMode) {
        await handleExportReady(payload);
        return;
      }

      dismissExportProgress();
      await input.onPreviewReady?.(payload);
    },
    [dismissExportProgress, handleExportReady, input, isExportMode],
  );

  const pollUntilReady = useCallback(
    async (runId: string): Promise<EstimatePdfOutputResult> => {
      if (!input.versionId) {
        return { ok: false, message: t("editor.pdfExport.failed") };
      }

      const startedAt = Date.now();

      while (Date.now() - startedAt < MAX_POLL_DURATION_MS) {
        const result = await pollEstimatePdfExportAction({
          estimateId: input.estimateId,
          versionId: input.versionId,
          workspaceId: input.workspaceId,
          workspaceSlug: input.workspaceSlug,
          locale: input.locale,
          runId,
        });

        if (!isMountedRef.current) {
          return { ok: false, message: t("editor.pdfExport.failed") };
        }

        if (!result.success) {
          showError(result.error);
          return { ok: false, message: result.error };
        }

        if (result.data.status === "ready") {
          await handleReady({
            url: result.data.url,
            fileName: result.data.fileName,
            viewerTitle: result.data.viewerTitle,
          });
          return { ok: true };
        }

        if (result.data.status === "failed") {
          const message = result.data.errorMessage ?? t("editor.pdfExport.failed");
          showError(message);
          return { ok: false, message };
        }

        await new Promise<void>((resolve) => {
          pollTimerRef.current = setTimeout(resolve, POLL_INTERVAL_MS);
        });
      }

      const message = t("editor.pdfExport.timeout");
      showError(message);
      return { ok: false, message };
    },
    [handleReady, input, showError, t],
  );

  const runPdfOutput = useCallback(async (): Promise<EstimatePdfOutputResult> => {
    if (!input.versionId || isRunning) {
      return { ok: false, message: t("editor.pdfExport.failed") };
    }

    setError(null);
    setIsRunning(true);
    clearPollTimer();
    clearViewerWindow();

    const fail = (message: string): EstimatePdfOutputResult => {
      showError(message);
      return { ok: false, message };
    };

    const abort = (): EstimatePdfOutputResult => {
      dismissExportProgress();
      clearViewerWindow();
      return { ok: false, message: "", cancelled: true };
    };

    try {
      if (input.onBeforeExport) {
        const gate = await input.onBeforeExport();
        if (!gate.proceed) {
          if (gate.reason === "unsaved") {
            return fail(t("editor.pdfExport.saveBeforeExport"));
          }
          return abort();
        }
      }

      if (isExportMode) {
        viewerWindowRef.current = openEstimatePdfPlaceholder({
          title: t("editor.pdfExport.generating"),
          hint: t("editor.pdfExport.generatingHint"),
        });
        showExportProgress();
      } else {
        input.onPreviewGenerationStarted?.();
      }

      const result = await exportEstimatePdfAction({
        estimateId: input.estimateId,
        versionId: input.versionId,
        workspaceId: input.workspaceId,
        workspaceSlug: input.workspaceSlug,
        locale: input.locale,
      });

      if (!isMountedRef.current) {
        return { ok: false, message: t("editor.pdfExport.failed") };
      }

      if (!result.success) {
        return fail(result.error);
      }

      if (result.data.status === "ready") {
        await handleReady({
          url: result.data.url,
          fileName: result.data.fileName,
          viewerTitle: result.data.viewerTitle,
        });
        return { ok: true };
      }

      const polled = await pollUntilReady(result.data.runId);
      return polled;
    } finally {
      dismissExportProgress();
      if (isMountedRef.current) {
        setIsRunning(false);
      }
      clearPollTimer();
    }
  }, [
    clearPollTimer,
    clearViewerWindow,
    dismissExportProgress,
    handleReady,
    input,
    isExportMode,
    isRunning,
    pollUntilReady,
    showError,
    showExportProgress,
    t,
  ]);

  return {
    runPdfOutput,
    isRunning,
    error,
    clearError: () => setError(null),
  };
}
