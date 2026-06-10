"use client";

import { useTranslations } from "next-intl";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  closeEstimatePdfWindow,
  navigateEstimatePdfWindow,
  openEstimatePdfFallback,
  openEstimatePdfPlaceholder,
} from "@/features/estimates/lib/open-estimate-pdf-document";
import { getEstimatePdfDownloadUrlAction } from "@/features/estimates/server/pdf-export-actions";
import type { EstimatePdfClient } from "@/features/estimates/lib/serialize-estimate-pdfs";
import type { Locale } from "@/lib/locale";
import { formatDate } from "@/i18n/formatters";

interface EstimatePdfDocumentsSectionProps {
  estimateId: string;
  workspaceId: string;
  locale: Locale;
  documents: EstimatePdfClient[];
}

export function EstimatePdfDocumentsSection({
  estimateId,
  workspaceId,
  locale,
  documents,
}: EstimatePdfDocumentsSectionProps) {
  const t = useTranslations("estimates");

  if (documents.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-muted-foreground">
        {t("editor.documents.empty")}
      </div>
    );
  }

  async function handleDownload(document: EstimatePdfClient) {
    const viewerWindow = openEstimatePdfPlaceholder({
      title: t("editor.documents.opening"),
      hint: t("editor.documents.openingHint"),
    });

    const result = await getEstimatePdfDownloadUrlAction({
      estimatePdfId: document.id,
      estimateId,
      workspaceId,
      locale,
    });

    if (!result.success) {
      closeEstimatePdfWindow(viewerWindow);
      return;
    }

    const navigated = navigateEstimatePdfWindow(viewerWindow, result.data.url);

    if (!navigated) {
      openEstimatePdfFallback(result.data.url, result.data.fileName);
      toast.info(t("editor.pdfExport.popupBlocked"));
    }
  }

  return (
    <div className="divide-y divide-border/60">
      {documents.map((document) => (
        <div
          key={document.id}
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {t("editor.documents.itemTitle", { version: document.versionNumber })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("editor.documents.generatedAt", {
                  date: formatDate(document.generatedAt, locale, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                })}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => void handleDownload(document)}
          >
            <Download className="size-4" />
            {t("editor.documents.download")}
          </Button>
        </div>
      ))}
    </div>
  );
}
