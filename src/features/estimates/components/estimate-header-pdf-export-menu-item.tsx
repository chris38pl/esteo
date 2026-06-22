"use client";

import { useTranslations } from "next-intl";
import { FileDown, Loader2 } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { estimateHeaderMoreMenuPinActionClass } from "@/features/estimates/lib/estimate-header-layout";
import { cn } from "@/lib/utils";

export function EstimateHeaderPdfExportMenuItem({
  onDownloadPdf,
  isDownloading,
  versionId,
}: {
  onDownloadPdf?: () => void;
  isDownloading?: boolean;
  versionId: string;
}) {
  const t = useTranslations("estimates");

  return (
    <DropdownMenuItem
      className={cn("gap-2", estimateHeaderMoreMenuPinActionClass)}
      disabled={!versionId || !onDownloadPdf || isDownloading}
      onSelect={() => {
        onDownloadPdf?.();
      }}
    >
      {isDownloading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <FileDown className="size-4" />
      )}
      {t("header.actions.savePdf")}
    </DropdownMenuItem>
  );
}
