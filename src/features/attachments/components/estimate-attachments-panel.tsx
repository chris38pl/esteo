"use client";

import { Download, FileText, Loader2, Plus, UploadCloud, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  deleteEstimateAttachmentAction,
  getAttachmentSignedUrlAction,
  listEstimateAttachmentsAction,
} from "@/features/attachments/server/attachments-actions";
import { downloadAttachmentFromUrl } from "@/features/attachments/lib/download-attachment";
import { formatBytes } from "@/features/attachments/lib/format-bytes";
import { MAX_FILES_PER_UPLOAD_BATCH } from "@/features/attachments/lib/constants";
import { needsThumbnailRefresh } from "@/features/attachments/lib/thumbnail-status";
import type {
  EstimateAttachmentClient,
  WorkspaceStorageSummaryClient,
} from "@/features/attachments/lib/serialize-attachments";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CARD_WIDTH_CLASS = "w-[10.5rem]";
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 8;
const MAX_POLL_DURATION_MS = 30_000;
const ACCEPT_TYPES =
  "image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx";

type UploadState = "idle" | "uploading" | "error";

function uploadWithProgress(
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<{ attachments: EstimateAttachmentClient[] }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/attachments/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as {
          attachments?: EstimateAttachmentClient[];
          error?: string;
        };

        if (xhr.status >= 200 && xhr.status < 300 && body.attachments) {
          resolve({ attachments: body.attachments });
          return;
        }

        reject(new Error(body.error ?? "Upload failed."));
      } catch {
        reject(new Error("Upload failed."));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.send(formData);
  });
}

interface EstimateAttachmentsPanelProps {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  initialAttachments: EstimateAttachmentClient[];
  storageSummary: WorkspaceStorageSummaryClient;
  readOnly?: boolean;
}

export function EstimateAttachmentsPanel({
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
  initialAttachments,
  storageSummary,
  readOnly = false,
}: EstimateAttachmentsPanelProps) {
  const t = useTranslations("estimates.attachments");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EstimateAttachmentClient | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [previewAttachment, setPreviewAttachment] = useState<EstimateAttachmentClient | null>(
    null,
  );
  const [previewFullUrl, setPreviewFullUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchSignedUrl = useCallback(
    async (attachmentId: string, variant: "original" | "thumbnail" = "original") => {
      const result = await getAttachmentSignedUrlAction({
        attachmentId,
        estimateId,
        workspaceId,
        locale,
        variant,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data.url;
    },
    [estimateId, workspaceId, locale],
  );

  const loadPreviewUrls = useCallback(
    async (items: EstimateAttachmentClient[]) => {
      const next: Record<string, string> = {};

      await Promise.all(
        items
          .filter((item) => item.attachmentType === "IMAGE" && item.hasThumbnail)
          .map(async (item) => {
            try {
              const url = await fetchSignedUrl(item.id, "thumbnail");
              next[item.id] = url;
            } catch {
              // Thumbnail unavailable — card falls back to icon.
            }
          }),
      );

      setPreviewUrls(next);
    },
    [fetchSignedUrl],
  );

  useEffect(() => {
    void loadPreviewUrls(attachments);
  }, [attachments, loadPreviewUrls]);

  const shouldPollThumbnails = attachments.some((item) =>
    needsThumbnailRefresh(item.thumbnailStatus),
  );

  useEffect(() => {
    if (!shouldPollThumbnails) {
      return;
    }

    const startedAt = Date.now();
    let attempts = 0;

    const intervalId = window.setInterval(() => {
      attempts += 1;
      const elapsed = Date.now() - startedAt;

      if (attempts > MAX_POLL_ATTEMPTS || elapsed >= MAX_POLL_DURATION_MS) {
        window.clearInterval(intervalId);
        return;
      }

      void listEstimateAttachmentsAction({ estimateId, workspaceId, locale }).then((result) => {
        if (result.success) {
          setAttachments(result.data.attachments);
        }
      });
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [shouldPollThumbnails, estimateId, workspaceId, locale]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || readOnly || storageSummary.level === "exhausted") {
      return;
    }

    const files = Array.from(fileList);

    if (files.length === 0) {
      return;
    }

    if (files.length > MAX_FILES_PER_UPLOAD_BATCH) {
      setError(t("errors.batchLimit", { max: MAX_FILES_PER_UPLOAD_BATCH }));
      return;
    }

    setError(null);
    setUploadState("uploading");
    setUploadProgress(0);

    const formData = new FormData();
    formData.set("estimateId", estimateId);
    formData.set("workspaceId", workspaceId);

    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const result = await uploadWithProgress(formData, setUploadProgress);
      setAttachments((current) => [...current, ...result.attachments]);
      setUploadState("idle");
      setUploadProgress(null);
    } catch (uploadError) {
      setUploadState("error");
      setUploadProgress(null);
      setError(uploadError instanceof Error ? uploadError.message : t("errors.uploadFailed"));
    }
  }

  function openDeleteDialog(attachment: EstimateAttachmentClient) {
    setDeleteTarget(attachment);
  }

  function closeDeleteDialog() {
    if (deletingId) {
      return;
    }

    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget || readOnly) {
      return;
    }

    const attachmentId = deleteTarget.id;

    setDeletingId(attachmentId);
    setError(null);

    const result = await deleteEstimateAttachmentAction({
      attachmentId,
      estimateId,
      workspaceId,
      workspaceSlug,
      locale,
    });

    setDeletingId(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setAttachments((current) => current.filter((item) => item.id !== attachmentId));
    setDeleteTarget(null);
  }

  async function handleDownload(attachment: EstimateAttachmentClient) {
    setDownloadingId(attachment.id);
    setError(null);

    try {
      const url = await fetchSignedUrl(attachment.id, "original");
      await downloadAttachmentFromUrl(url, attachment.originalFileName);
    } catch {
      setError(t("downloadFailed"));
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleImagePreview(attachment: EstimateAttachmentClient) {
    if (attachment.attachmentType !== "IMAGE") {
      return;
    }

    setPreviewAttachment(attachment);
    setPreviewFullUrl(null);
    setPreviewLoading(true);

    try {
      const url = await fetchSignedUrl(attachment.id, "original");
      setPreviewFullUrl(url);
    } catch {
      setPreviewAttachment(null);
      setError(t("previewFailed"));
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    setPreviewAttachment(null);
    setPreviewFullUrl(null);
    setPreviewLoading(false);
  }

  const quotaWarning =
    storageSummary.level === "approaching_limit" || storageSummary.level === "exhausted";

  return (
    <div className="space-y-4 px-4 py-5">
      <div
        className={cn(
          "rounded-xl border px-3 py-2.5 text-sm",
          quotaWarning
            ? "border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-100"
            : "border-border bg-muted/30 text-muted-foreground",
        )}
      >
        <p className="font-medium text-foreground">
          {t("storageUsage", {
            used: storageSummary.usedFormatted,
            limit: storageSummary.limitFormatted,
          })}
        </p>
        {storageSummary.level === "approaching_limit" ? (
          <p className="mt-1 text-xs">{t("storageApproachingLimit")}</p>
        ) : null}
        {storageSummary.level === "exhausted" ? (
          <p className="mt-1 text-xs">{t("storageExhausted")}</p>
        ) : null}
      </div>

      {!readOnly && storageSummary.level !== "exhausted" ? (
        <>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT_TYPES}
            className="hidden"
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void handleFiles(event.dataTransfer.files);
            }}
            disabled={uploadState === "uploading"}
            className={cn(
              "flex min-h-24 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-input",
              "bg-background/60 px-4 py-5 text-center shadow-xs transition hover:bg-accent/50 dark:bg-input/20",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {uploadState === "uploading" ? (
              <>
                <Loader2 className="mb-2 size-5 animate-spin text-primary" />
                <span className="text-xs font-semibold">{t("uploading", { percent: uploadProgress ?? 0 })}</span>
              </>
            ) : (
              <>
                <span className="mb-3 grid size-9 place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                  <UploadCloud className="size-4" />
                </span>
                <span className="text-xs font-semibold text-foreground">{t("dropzoneTitle")}</span>
                <span className="mt-1 text-[10px] text-muted-foreground">{t("dropzoneHint")}</span>
              </>
            )}
          </button>
        </>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {attachments.length > 0 ? (
        <div className="w-full overflow-x-auto pb-1 sidebar-scroll">
          <div className="flex w-max gap-2">
            {!readOnly && storageSummary.level !== "exhausted" ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploadState === "uploading"}
                className={cn(
                  CARD_WIDTH_CLASS,
                  "flex h-[11.25rem] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-input",
                  "bg-background/60 text-center shadow-xs transition hover:bg-accent/50 dark:bg-input/20",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <span className="mb-3 grid size-10 place-items-center rounded-full border border-border bg-card text-muted-foreground">
                  <Plus className="size-5" />
                </span>
                <span className="text-xs font-semibold text-foreground">{t("addMore")}</span>
              </button>
            ) : null}

            {attachments.map((attachment) => {
              const isImage = attachment.attachmentType === "IMAGE";
              const thumbnailUrl = previewUrls[attachment.id];

              return (
                <article
                  key={attachment.id}
                  className={cn(
                    CARD_WIDTH_CLASS,
                    "flex h-[11.25rem] shrink-0 flex-col overflow-hidden rounded-2xl border border-input bg-card shadow-xs",
                  )}
                >
                  <div className="relative min-h-0 flex-1 bg-muted/40">
                    {isImage && thumbnailUrl ? (
                      <button
                        type="button"
                        onClick={() => void handleImagePreview(attachment)}
                        className="size-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
                        aria-label={t("previewImage")}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbnailUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <FileText className="size-8" />
                      </div>
                    )}
                    {!readOnly ? (
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="secondary"
                        className="absolute top-1.5 right-1.5 size-6 border border-border/60 bg-card/90 text-muted-foreground shadow-xs hover:text-foreground"
                        aria-label={t("remove")}
                        onClick={(event) => {
                          event.stopPropagation();
                          openDeleteDialog(attachment);
                        }}
                      >
                        <X className="size-3" />
                      </Button>
                    ) : null}
                  </div>
                  <div className="shrink-0 border-t border-input bg-background/80 px-2.5 py-2 dark:bg-input/30">
                    <p className="line-clamp-2 text-[11px] leading-4 font-semibold text-foreground">
                      {attachment.originalFileName}
                    </p>
                    {attachment.uploadSource !== "EDITOR" ? (
                      <p className="mt-0.5 text-[9px] text-muted-foreground">
                        {t(`uploadSource.${attachment.uploadSource}`)}
                      </p>
                    ) : null}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-[10px] text-muted-foreground">
                        {formatBytes(Number(attachment.fileSizeBytes))}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                        aria-label={t("download")}
                        disabled={downloadingId === attachment.id}
                        onClick={() => void handleDownload(attachment)}
                      >
                        {downloadingId === attachment.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Download className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <DialogContent showCloseButton={!deletingId} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("delete.title", { fileName: deleteTarget?.originalFileName ?? "" })}
            </DialogTitle>
            <DialogDescription>{t("delete.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" disabled={Boolean(deletingId)} onClick={closeDeleteDialog}>
              {t("delete.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!deleteTarget || Boolean(deletingId)}
              onClick={() => void confirmDelete()}
            >
              {deletingId ? t("delete.deleting") : t("delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewAttachment !== null} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="truncate pr-8 text-sm font-semibold">
              {previewAttachment?.originalFileName ?? t("previewImage")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[calc(90vh-4rem)] min-h-[12rem] items-center justify-center bg-muted/30 p-4">
            {previewLoading ? (
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
                <span>{t("previewLoading")}</span>
              </div>
            ) : previewFullUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewFullUrl}
                alt={previewAttachment?.originalFileName ?? ""}
                className="max-h-[calc(90vh-6rem)] w-auto max-w-full object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
