"use client";

import { useTranslations } from "next-intl";
import { FileDown, Loader2 } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { EstimatePdfBeforeExportResult } from "@/features/estimates/hooks/use-estimate-pdf-output";
import { useEstimatePdfExport } from "@/features/estimates/hooks/use-estimate-pdf-export";
import { estimateHeaderMoreMenuPinActionClass } from "@/features/estimates/lib/estimate-header-layout";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function EstimateHeaderPdfExportMenuItem({
  estimateId,
  versionId,
  workspaceId,
  workspaceSlug,
  locale,
  onBeforeExport,
}: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  onBeforeExport?: () => Promise<EstimatePdfBeforeExportResult>;
}) {
  const t = useTranslations("estimates");
  const { exportPdf, isExporting } = useEstimatePdfExport({
    estimateId,
    versionId,
    workspaceId,
    workspaceSlug,
    locale,
    onBeforeExport,
  });

  return (
    <DropdownMenuItem
      className={cn("gap-2", estimateHeaderMoreMenuPinActionClass)}
      disabled={!versionId || isExporting}
      onSelect={() => {
        void exportPdf();
      }}
    >
      {isExporting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <FileDown className="size-4" />
      )}
      {t("header.actions.savePdf")}
    </DropdownMenuItem>
  );
}
