"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { appToast } from "@/components/ui/app-toast";

import {
  exportEstimatePdfAction,
  getEstimatePdfDownloadUrlAction,
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

type PollOutcome = "pending" | "success" | "failure";

export function useEstimatePdfOutput(input: {
  estimateId: string;
  versionId: string | null;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  mode: EstimatePdfOutputMode;
  serverLatestPdfId?: string | null;
  serverLatestPdfGeneratedAt?: string | null;
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
  const exportStartedAtRef = useRef<number | null>(null);
  const activeRunIdRef = useRef<string | null>(null);
  const pollLoopActiveRef = useRef(false);
  const pollInFlightRef = useRef(false);
  const reconciledExportRef = useRef(false);
  const lastFailureMessageRef = useRef<string | null>(null);
  const isExportMode = input.mode === "export";

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const dismissExportProgress = useCallback(() => {
    if (loadingToastIdRef.current != null) {
      appToast.dismiss(loadingToastIdRef.current);
      loadingToastIdRef.current = null;
    }
  }, []);

  const showExportProgress = useCallback(() => {
    if (!isExportMode) {
      return;
    }

    dismissExportProgress();
    loadingToastIdRef.current = appToast.loading(t("editor.pdfExport.generating"), {
      description: t("editor.pdfExport.generatingHint"),
      position: ESTIMATE_ASYNC_TOAST_POSITION,
    });
  }, [dismissExportProgress, isExportMode, t]);

  const clearViewerWindow = useCallback(() => {
    closeEstimatePdfWindow(viewerWindowRef.current);
    viewerWindowRef.current = null;
  }, []);

  const finishExportRun = useCallback(() => {
    exportStartedAtRef.current = null;
    activeRunIdRef.current = null;
    pollLoopActiveRef.current = false;
    pollInFlightRef.current = false;
    reconciledExportRef.current = false;
    lastFailureMessageRef.current = null;
    clearPollTimer();
    dismissExportProgress();
    if (isMountedRef.current) {
      setIsRunning(false);
    }
  }, [clearPollTimer, dismissExportProgress]);

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
      lastFailureMessageRef.current = message;
      finishExportRun();
      clearViewerWindow();
      setError(message);

      if (isExportMode) {
        appToast.error(message, { position: ESTIMATE_ASYNC_TOAST_POSITION });
      }
    },
    [clearViewerWindow, finishExportRun, isExportMode],
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
        appToast.info(t("editor.pdfExport.popupBlocked"), {
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

  const completeFromServerPdf = useCallback(
    async (estimatePdfId: string) => {
      if (reconciledExportRef.current || !isMountedRef.current) {
        return false;
      }

      reconciledExportRef.current = true;

      const result = await getEstimatePdfDownloadUrlAction({
        estimatePdfId,
        estimateId: input.estimateId,
        workspaceId: input.workspaceId,
        locale: input.locale,
      });

      if (!isMountedRef.current) {
        return false;
      }

      if (!result.success) {
        reconciledExportRef.current = false;
        return false;
      }

      await handleReady({
        url: result.data.url,
        fileName: result.data.fileName,
        viewerTitle: result.data.viewerTitle,
      });
      finishExportRun();
      return true;
    },
    [finishExportRun, handleReady, input.estimateId, input.locale, input.workspaceId],
  );

  const pollOnce = useCallback(async (): Promise<PollOutcome> => {
    const runId = activeRunIdRef.current;
    if (!runId || !input.versionId || pollInFlightRef.current) {
      return "pending";
    }

    pollInFlightRef.current = true;

    try {
      const result = await pollEstimatePdfExportAction({
        estimateId: input.estimateId,
        versionId: input.versionId,
        workspaceId: input.workspaceId,
        workspaceSlug: input.workspaceSlug,
        locale: input.locale,
        runId,
      });

      if (!isMountedRef.current) {
        return "failure";
      }

      if (!result.success) {
        showError(result.error);
        return "failure";
      }

      if (result.data.status === "ready") {
        await handleReady({
          url: result.data.url,
          fileName: result.data.fileName,
          viewerTitle: result.data.viewerTitle,
        });
        finishExportRun();
        return "success";
      }

      if (result.data.status === "failed") {
        const message = result.data.errorMessage ?? t("editor.pdfExport.failed");
        showError(message);
        return "failure";
      }

      return "pending";
    } finally {
      pollInFlightRef.current = false;
    }
  }, [
    finishExportRun,
    handleReady,
    input,
    showError,
    t,
  ]);

  const pollUntilReady = useCallback(
    async (runId: string): Promise<EstimatePdfOutputResult> => {
      if (!input.versionId) {
        return { ok: false, message: t("editor.pdfExport.failed") };
      }

      activeRunIdRef.current = runId;
      pollLoopActiveRef.current = true;
      const startedAt = Date.now();

      try {
        while (Date.now() - startedAt < MAX_POLL_DURATION_MS) {
          const outcome = await pollOnce();
          if (outcome === "success") {
            return { ok: true };
          }
          if (outcome === "failure") {
            return {
              ok: false,
              message: lastFailureMessageRef.current ?? t("editor.pdfExport.failed"),
            };
          }

          await new Promise<void>((resolve) => {
            pollTimerRef.current = setTimeout(resolve, POLL_INTERVAL_MS);
          });
        }

        const message = t("editor.pdfExport.timeout");
        showError(message);
        return { ok: false, message };
      } finally {
        pollLoopActiveRef.current = false;
      }
    },
    [input.versionId, pollOnce, showError, t],
  );

  const runPdfOutput = useCallback(async (): Promise<EstimatePdfOutputResult> => {
    if (!input.versionId || isRunning) {
      return { ok: false, message: t("editor.pdfExport.failed") };
    }

    setError(null);
    setIsRunning(true);
    reconciledExportRef.current = false;
    exportStartedAtRef.current = Date.now();
    clearPollTimer();
    clearViewerWindow();

    const fail = (message: string): EstimatePdfOutputResult => {
      showError(message);
      return { ok: false, message };
    };

    const abort = (): EstimatePdfOutputResult => {
      finishExportRun();
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
        finishExportRun();
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
        finishExportRun();
        return { ok: true };
      }

      return await pollUntilReady(result.data.runId);
    } catch {
      return fail(t("editor.pdfExport.failed"));
    }
  }, [
    clearPollTimer,
    clearViewerWindow,
    finishExportRun,
    handleReady,
    input,
    isExportMode,
    isRunning,
    pollUntilReady,
    showError,
    showExportProgress,
    t,
  ]);

  useEffect(() => {
    if (
      !isRunning ||
      !isExportMode ||
      !exportStartedAtRef.current ||
      !input.serverLatestPdfId ||
      !input.serverLatestPdfGeneratedAt ||
      reconciledExportRef.current
    ) {
      return;
    }

    const generatedAtMs = Date.parse(input.serverLatestPdfGeneratedAt);
    if (
      !Number.isFinite(generatedAtMs) ||
      generatedAtMs < exportStartedAtRef.current - 2_000
    ) {
      return;
    }

    void completeFromServerPdf(input.serverLatestPdfId);
  }, [
    completeFromServerPdf,
    input.serverLatestPdfGeneratedAt,
    input.serverLatestPdfId,
    isExportMode,
    isRunning,
  ]);

  useEffect(() => {
    if (!isRunning || !activeRunIdRef.current) {
      return;
    }

    const watchdogId = setInterval(() => {
      if (!isRunning || pollLoopActiveRef.current || pollInFlightRef.current) {
        return;
      }

      void pollOnce();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(watchdogId);
  }, [isRunning, pollOnce]);

  return {
    runPdfOutput,
    isRunning,
    error,
    clearError: () => setError(null),
  };
}
