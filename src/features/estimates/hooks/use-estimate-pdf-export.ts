"use client";

import { useEstimatePdfOutput, type EstimatePdfBeforeExportResult } from "@/features/estimates/hooks/use-estimate-pdf-output";
import type { Locale } from "@/lib/locale";

export function useEstimatePdfExport(input: {
  estimateId: string;
  versionId: string | null;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  onBeforeExport?: () => Promise<EstimatePdfBeforeExportResult>;
}) {
  const { runPdfOutput, isRunning, error, clearError } = useEstimatePdfOutput({
    ...input,
    mode: "export",
  });

  return {
    exportPdf: runPdfOutput,
    isExporting: isRunning,
    error,
    clearError,
  };
}
