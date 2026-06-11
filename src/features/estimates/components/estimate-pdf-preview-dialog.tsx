"use client";

import { useTranslations } from "next-intl";
import { Download, ExternalLink, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEstimateMobileLayout } from "@/features/estimates/hooks/use-estimate-mobile-layout";

export type EstimatePdfPreviewDialogState =
  | { status: "closed" }
  | { status: "loading" }
  | {
      status: "ready";
      blobUrl: string;
      fileName: string;
      viewerTitle: string;
    }
  | { status: "error"; message: string };

interface EstimatePdfPreviewDialogProps {
  state: EstimatePdfPreviewDialogState;
  onOpenChange: (open: boolean) => void;
}

export function EstimatePdfPreviewDialog({
  state,
  onOpenChange,
}: EstimatePdfPreviewDialogProps) {
  const t = useTranslations("estimates");
  const isMobile = useEstimateMobileLayout();
  const isOpen = state.status !== "closed";

  function handleDownload() {
    if (state.status !== "ready") {
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = state.blobUrl;
    anchor.download = state.fileName;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function handleOpenPdf() {
    if (state.status !== "ready") {
      return;
    }

    window.open(state.blobUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent
        showCloseButton={state.status !== "loading"}
        className="flex h-[min(90vh,56rem)] max-w-[min(96vw,64rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,64rem)]"
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-5 py-4 text-left">
          <DialogTitle>
            {state.status === "ready"
              ? state.viewerTitle
              : t("editor.pdfPreview.title")}
          </DialogTitle>
          <DialogDescription>
            {state.status === "loading"
              ? t("editor.pdfPreview.loadingHint")
              : state.status === "error"
                ? state.message
                : isMobile && state.status === "ready"
                  ? t("editor.pdfPreview.mobileHint")
                  : t("editor.pdfPreview.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-0 flex-1 bg-muted/20">
          {state.status === "loading" ? (
            <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-3 px-6 text-center">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                {t("editor.pdfPreview.loading")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("editor.pdfPreview.loadingHint")}
              </p>
            </div>
          ) : null}

          {state.status === "error" ? (
            <div className="flex h-full min-h-[12rem] items-center justify-center px-6 text-center text-sm text-destructive">
              {state.message}
            </div>
          ) : null}

          {state.status === "ready" && isMobile ? (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="max-w-sm text-sm text-muted-foreground">
                {t("editor.pdfPreview.mobileHint")}
              </p>
              <Button type="button" size="lg" onClick={handleOpenPdf}>
                <ExternalLink className="size-4" />
                {t("editor.pdfPreview.open")}
              </Button>
            </div>
          ) : null}

          {state.status === "ready" && !isMobile ? (
            <iframe
              src={state.blobUrl}
              title={state.viewerTitle}
              className="absolute inset-0 size-full border-0 bg-background"
            />
          ) : null}
        </div>

        {state.status === "ready" ? (
          <DialogFooter className="shrink-0 border-t border-border/60 px-5 py-4 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("editor.pdfPreview.close")}
            </Button>
            <div className="flex flex-wrap gap-2">
              {isMobile ? (
                <Button type="button" onClick={handleOpenPdf}>
                  <ExternalLink className="size-4" />
                  {t("editor.pdfPreview.open")}
                </Button>
              ) : null}
              <Button type="button" onClick={handleDownload}>
                <Download className="size-4" />
                {t("editor.pdfPreview.download")}
              </Button>
            </div>
          </DialogFooter>
        ) : null}

        {state.status === "error" ? (
          <DialogFooter className="shrink-0 border-t border-border/60 px-5 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("editor.pdfPreview.close")}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
