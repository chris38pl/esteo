"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type {
  EstimateSendTransportStatus,
  EstimateVersionStatus,
} from "@prisma/client";

import {
  completeEstimateAsyncError,
  completeEstimateAsyncSuccess,
  dismissEstimateAsyncToast,
  estimateSendToastId,
  showEstimateAsyncLoading,
  updateEstimateAsyncLoading,
} from "@/features/estimates/lib/estimate-async-toast";
import { formatEstimateSendErrorMessage } from "@/features/estimates/lib/format-estimate-send-error";
import { hasActiveSendJob } from "@/features/estimates/lib/version-mutability";
import { pollEstimateSendAction } from "@/features/estimates/server/send-estimate-actions";
import type { Locale } from "@/lib/locale";

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_DURATION_MS = 120_000;

export type EstimateSendProgressPhase =
  | "idle"
  | "queued"
  | "generating_pdf"
  | "sending"
  | "completed"
  | "failed";

function phaseFromTransportStatus(
  status: EstimateSendTransportStatus,
): EstimateSendProgressPhase {
  switch (status) {
    case "QUEUED":
      return "queued";
    case "GENERATING_PDF":
      return "generating_pdf";
    case "SENDING":
      return "sending";
    case "PROVIDER_ACCEPTED":
    case "DELIVERED":
      return "completed";
    case "FAILED":
      return "failed";
    default:
      return "queued";
  }
}

export function useEstimateSendPolling(input: {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  versionStatus: EstimateVersionStatus;
  activeSendTransportStatus: EstimateSendTransportStatus | null | undefined;
}) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const [phase, setPhase] = useState<EstimateSendProgressPhase>("idle");
  const [activeToastSendId, setActiveToastSendId] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartedAtRef = useRef<number | null>(null);
  const activeSendRef = useRef<{ sendId: string; runId: string } | null>(null);
  const terminalSendIdsRef = useRef<Set<string>>(new Set());
  const resumedSendIdsRef = useRef<Set<string>>(new Set());
  const pollInFlightRef = useRef(false);
  const isPollingRef = useRef(false);
  const activeToastSendIdRef = useRef<string | null>(null);

  const progressHint = t("send.progress.hint");

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const finishPolling = useCallback(() => {
    clearPollTimer();
    pollStartedAtRef.current = null;
    activeSendRef.current = null;
    isPollingRef.current = false;
    pollInFlightRef.current = false;
  }, [clearPollTimer]);

  const phaseLabel = useCallback(
    (currentPhase: EstimateSendProgressPhase): string => {
      switch (currentPhase) {
        case "generating_pdf":
          return t("send.progress.generatingPdf");
        case "sending":
          return t("send.progress.sending");
        default:
          return t("send.progress.queued");
      }
    },
    [t],
  );

  const updateProgressToast = useCallback(
    (sendId: string, currentPhase: EstimateSendProgressPhase) => {
      const toastId = estimateSendToastId(sendId);
      updateEstimateAsyncLoading(toastId, phaseLabel(currentPhase), progressHint);
      setActiveToastSendId(sendId);
    },
    [phaseLabel, progressHint],
  );

  const markTerminal = useCallback(
    (sendId: string) => {
      terminalSendIdsRef.current.add(sendId);
    },
    [],
  );

  const handleFailure = useCallback(
    (sendId: string, rawMessage: string | undefined) => {
      const friendlyMessage =
        formatEstimateSendErrorMessage(rawMessage) || t("send.error");

      markTerminal(sendId);
      setPhase("failed");
      finishPolling();
      completeEstimateAsyncError(
        estimateSendToastId(sendId),
        friendlyMessage,
      );
      setActiveToastSendId(null);
      router.refresh();
    },
    [finishPolling, markTerminal, router, t],
  );

  const handleSuccess = useCallback(
    (sendId: string) => {
      markTerminal(sendId);
      setPhase("completed");
      finishPolling();
      completeEstimateAsyncSuccess(
        estimateSendToastId(sendId),
        t("send.success"),
      );
      setActiveToastSendId(null);
      router.refresh();
    },
    [finishPolling, markTerminal, router, t],
  );

  const pollOnce = useCallback(async () => {
    const active = activeSendRef.current;
    if (!active || !isPollingRef.current || pollInFlightRef.current) {
      return;
    }

    if (terminalSendIdsRef.current.has(active.sendId)) {
      return;
    }

    pollInFlightRef.current = true;

    try {
      const result = await pollEstimateSendAction({
        estimateId: input.estimateId,
        workspaceId: input.workspaceId,
        workspaceSlug: input.workspaceSlug,
        locale: input.locale,
        sendId: active.sendId,
        runId: active.runId,
      });

      if (!activeSendRef.current || !isPollingRef.current) {
        return;
      }

      if (terminalSendIdsRef.current.has(active.sendId)) {
        return;
      }

      if (!result.success) {
        handleFailure(active.sendId, result.error);
        return;
      }

      if (result.data.status === "pending") {
        const nextPhase = phaseFromTransportStatus(result.data.transportStatus);
        setPhase(nextPhase);
        updateProgressToast(active.sendId, nextPhase);
        return;
      }

      if (result.data.status === "failed") {
        handleFailure(active.sendId, result.data.errorMessage);
        return;
      }

      handleSuccess(active.sendId);
    } finally {
      pollInFlightRef.current = false;
    }
  }, [
    handleFailure,
    handleSuccess,
    input.estimateId,
    input.locale,
    input.workspaceId,
    input.workspaceSlug,
    updateProgressToast,
  ]);

  const schedulePoll = useCallback(() => {
    clearPollTimer();
    pollTimerRef.current = setTimeout(() => {
      void pollOnce().then(() => {
        if (!activeSendRef.current || !isPollingRef.current) {
          return;
        }

        if (
          pollStartedAtRef.current != null &&
          Date.now() - pollStartedAtRef.current > MAX_POLL_DURATION_MS
        ) {
          handleFailure(activeSendRef.current.sendId, t("send.timeout"));
          return;
        }

        schedulePoll();
      });
    }, POLL_INTERVAL_MS);
  }, [clearPollTimer, handleFailure, pollOnce, t]);

  const startPolling = useCallback(
    (sendId: string, runId: string) => {
      if (terminalSendIdsRef.current.has(sendId)) {
        return;
      }

      finishPolling();
      activeSendRef.current = { sendId, runId };
      pollStartedAtRef.current = Date.now();
      isPollingRef.current = true;
      setPhase("queued");
      setActiveToastSendId(sendId);

      showEstimateAsyncLoading(
        estimateSendToastId(sendId),
        t("send.progress.queued"),
        progressHint,
      );

      void pollOnce();
      schedulePoll();
    },
    [finishPolling, pollOnce, progressHint, schedulePoll, t],
  );

  const resumePollingIfNeeded = useCallback(
    (sendId: string, runId: string) => {
      if (terminalSendIdsRef.current.has(sendId)) {
        return;
      }
      if (isPollingRef.current && activeSendRef.current?.sendId === sendId) {
        return;
      }
      if (resumedSendIdsRef.current.has(sendId) && isPollingRef.current) {
        return;
      }

      resumedSendIdsRef.current.add(sendId);
      startPolling(sendId, runId);
    },
    [startPolling],
  );

  const shouldResumePolling = useCallback((sendId: string) => {
    return !terminalSendIdsRef.current.has(sendId);
  }, []);

  const dismissSendError = useCallback(() => {
    if (activeToastSendId) {
      dismissEstimateAsyncToast(estimateSendToastId(activeToastSendId));
    }
    setPhase("idle");
    setActiveToastSendId(null);
  }, [activeToastSendId]);

  useEffect(() => {
    activeToastSendIdRef.current = activeToastSendId;
  }, [activeToastSendId]);

  useEffect(() => {
    return () => {
      finishPolling();
      const sendId = activeToastSendIdRef.current;
      if (sendId) {
        dismissEstimateAsyncToast(estimateSendToastId(sendId));
      }
    };
  }, [finishPolling]);

  const isSending = phase !== "idle" && phase !== "completed" && phase !== "failed";

  useEffect(() => {
    const trackedSendId = activeSendRef.current?.sendId ?? activeToastSendId;
    if (!trackedSendId || terminalSendIdsRef.current.has(trackedSendId)) {
      return;
    }

    const serverJobActive = hasActiveSendJob(input.activeSendTransportStatus);
    const versionSettled =
      input.versionStatus === "SENT" ||
      input.versionStatus === "ACCEPTED" ||
      input.versionStatus === "REJECTED";

    if (versionSettled && !serverJobActive && isSending) {
      handleSuccess(trackedSendId);
    }
  }, [
    activeToastSendId,
    handleSuccess,
    input.activeSendTransportStatus,
    input.versionStatus,
    isSending,
  ]);

  return {
    phase,
    isSending,
    startPolling,
    resumePollingIfNeeded,
    shouldResumePolling,
    dismissSendError,
  };
}
