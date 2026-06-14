"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { EstimatePdfPreviewDialogState } from "@/features/estimates/components/estimate-pdf-preview-dialog";
import {
  fetchEstimatePdfBlobUrl,
  revokeEstimatePdfBlobUrl,
} from "@/features/estimates/lib/fetch-estimate-pdf-blob-url";
import { useEstimatePdfOutput, type EstimatePdfBeforeExportResult } from "@/features/estimates/hooks/use-estimate-pdf-output";
import type { Locale } from "@/lib/locale";

export function useEstimatePdfPreview(input: {
  estimateId: string;
  versionId: string | null;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  onBeforeExport?: () => Promise<EstimatePdfBeforeExportResult>;
}) {
  const t = useTranslations("estimates");
  const blobUrlRef = useRef<string | null>(null);
  const [previewState, setPreviewState] = useState<EstimatePdfPreviewDialogState>({
    status: "closed",
  });

  const clearBlobUrl = useCallback(() => {
    revokeEstimatePdfBlobUrl(blobUrlRef.current);
    blobUrlRef.current = null;
  }, []);

  const closePreview = useCallback(() => {
    clearBlobUrl();
    setPreviewState({ status: "closed" });
  }, [clearBlobUrl]);

  const handlePreviewReady = useCallback(
    async (payload: { url: string; fileName: string; viewerTitle: string }) => {
      try {
        clearBlobUrl();
        const blobUrl = await fetchEstimatePdfBlobUrl(payload.url, payload.fileName);
        blobUrlRef.current = blobUrl;
        setPreviewState({
          status: "ready",
          blobUrl,
          fileName: payload.fileName,
          viewerTitle: payload.viewerTitle,
        });
      } catch {
        setPreviewState({
          status: "error",
          message: t("editor.pdfPreview.loadFailed"),
        });
      }
    },
    [clearBlobUrl, t],
  );

  const { runPdfOutput, isRunning } = useEstimatePdfOutput({
    ...input,
    mode: "preview",
    onPreviewGenerationStarted: () => {
      setPreviewState({ status: "loading" });
    },
    onPreviewReady: handlePreviewReady,
  });

  const previewPdf = useCallback(async () => {
    if (!input.versionId || isRunning) {
      return;
    }

    clearBlobUrl();

    const result = await runPdfOutput();

    if (!result.ok) {
      if (result.cancelled) {
        setPreviewState({ status: "closed" });
        return;
      }

      setPreviewState({ status: "error", message: result.message });
    }
  }, [clearBlobUrl, input.versionId, isRunning, runPdfOutput]);

  return {
    previewPdf,
    isPreviewLoading: isRunning,
    previewState,
    closePreview,
  };
}
