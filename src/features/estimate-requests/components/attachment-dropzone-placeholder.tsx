"use client";

import { FileText, Loader2, Plus, RotateCcw, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { PublicAttachmentAvailability } from "@/features/attachments/lib/attachment-availability";
import { isAttachmentUploadAvailable } from "@/features/attachments/lib/attachment-availability";
import {
  MAX_REQUEST_ATTACHMENT_FILES,
  MAX_REQUEST_ATTACHMENT_TOTAL_BYTES,
} from "@/features/attachments/lib/request-limits";
import type { StagingAttachmentItem } from "@/features/attachments/lib/staging-attachment-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const CARD_WIDTH_CLASS = "w-[10.5rem]";

type FileCountLabel = string | ((current: number, max: number) => string);

function formatFileCountLabel(
  label: FileCountLabel,
  current: number,
  max: number,
): string {
  if (typeof label === "function") {
    return label(current, max);
  }

  return label.replace("{current}", String(current)).replace("{max}", String(max));
}

export function AttachmentDropzone({
  items,
  onAddFiles,
  onRemove,
  onRetry,
  attachmentAvailability,
  disabled = false,
  accept = "image/*,.pdf,.doc,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  maxFiles = MAX_REQUEST_ATTACHMENT_FILES,
  maxTotalBytes = MAX_REQUEST_ATTACHMENT_TOTAL_BYTES,
  fullWidth = false,
  localError = null,
  labels,
}: {
  items: StagingAttachmentItem[];
  onAddFiles: (files: FileList | null) => void;
  onRemove: (clientId: string) => void;
  onRetry: (clientId: string) => void;
  attachmentAvailability?: PublicAttachmentAvailability;
  disabled?: boolean;
  accept?: string;
  maxFiles?: number;
  maxTotalBytes?: number | null;
  fullWidth?: boolean;
  localError?: string | null;
  labels?: {
    title?: string;
    hint?: string;
    addFile?: string;
    fileCount?: FileCountLabel;
    remove?: string;
    retry?: string;
    uploading?: string;
    failed?: string;
    maxFiles?: string;
    maxSize?: string;
  };
}) {
  const t = useTranslations("estimateRequests.attachments");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const copy = {
    title: labels?.title ?? t("title"),
    hint: labels?.hint ?? t("hint"),
    addFile: labels?.addFile ?? t("addFile"),
    fileCount: labels?.fileCount ?? ((current, max) => t("fileCount", { current, max })),
    remove: labels?.remove ?? t("remove"),
    retry: labels?.retry ?? t("retry"),
    uploading: labels?.uploading ?? t("uploading"),
    failed: labels?.failed ?? t("failed"),
    maxFiles: labels?.maxFiles ?? t("errors.maxFiles"),
    maxSize: labels?.maxSize ?? t("errors.maxSize"),
  };

  const uploadsAvailable =
    attachmentAvailability === undefined || isAttachmentUploadAvailable(attachmentAvailability);

  useEffect(() => {
    return () => {
      for (const attachment of itemsRef.current) {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      }
    };
  }, []);

  if (!uploadsAvailable) {
    return (
      <div className="space-y-2">
        <div
          className={cn(
            "flex min-h-24 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-input",
            "bg-muted/30 px-4 py-5 text-center opacity-80",
          )}
        >
          <span className="text-xs font-semibold text-foreground">{t("unavailableTitle")}</span>
          <span className="mt-1 text-[10px] text-muted-foreground">{t("unavailableHint")}</span>
        </div>
      </div>
    );
  }

  function openFilePicker() {
    if (disabled || items.length >= maxFiles) {
      return;
    }

    inputRef.current?.click();
  }

  const canAddMore = items.length < maxFiles;
  const displayError =
    localError === "maxFiles"
      ? copy.maxFiles
      : localError === "maxSize"
        ? copy.maxSize
        : null;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          onAddFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {items.length === 0 ? (
        <button
          type="button"
          onClick={openFilePicker}
          disabled={disabled}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onAddFiles(event.dataTransfer.files);
          }}
          className={cn(
            "flex min-h-24 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-input",
            "bg-background/60 px-4 py-5 text-center shadow-xs transition hover:bg-accent/50 dark:bg-input/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span className="mb-3 grid size-9 place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary">
            <UploadCloud className="size-4" />
          </span>
          <span className="text-xs font-semibold text-foreground">{copy.title}</span>
          <span className="mt-1 text-[10px] text-muted-foreground">{copy.hint}</span>
        </button>
      ) : (
        <div
          className={cn(
            "w-full overflow-x-auto pb-1 sidebar-scroll",
            !fullWidth && "max-w-[calc(4*10.5rem+3*0.5rem)]",
          )}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onAddFiles(event.dataTransfer.files);
          }}
        >
          <div className="flex w-max gap-2">
            <button
              type="button"
              onClick={openFilePicker}
              disabled={!canAddMore || disabled}
              className={cn(
                CARD_WIDTH_CLASS,
                "flex h-[11.25rem] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-input",
                "bg-background/60 text-center shadow-xs transition hover:bg-accent/50 dark:bg-input/20",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <span className="mb-3 grid size-10 place-items-center rounded-full border border-border bg-card text-muted-foreground">
                <Plus className="size-5" />
              </span>
              <span className="text-xs font-semibold text-foreground">{copy.addFile}</span>
              <span className="mt-1 text-[10px] text-muted-foreground">
                {formatFileCountLabel(copy.fileCount, items.length, maxFiles)}
              </span>
            </button>

            {items.map((attachment) => (
              <AttachmentPreviewCard
                key={attachment.clientId}
                attachment={attachment}
                removeLabel={copy.remove}
                retryLabel={copy.retry}
                uploadingLabel={copy.uploading}
                failedLabel={copy.failed}
                disabled={disabled}
                onRemove={() => onRemove(attachment.clientId)}
                onRetry={() => onRetry(attachment.clientId)}
              />
            ))}
          </div>
        </div>
      )}

      {displayError ? <p className="text-[11px] text-destructive">{displayError}</p> : null}
    </div>
  );
}

/** @deprecated Use AttachmentDropzone with staging upload hook */
export function AttachmentDropzonePlaceholder({
  attachmentAvailability,
}: {
  attachmentAvailability?: PublicAttachmentAvailability;
}) {
  return (
    <AttachmentDropzone
      items={[]}
      onAddFiles={() => undefined}
      onRemove={() => undefined}
      onRetry={() => undefined}
      attachmentAvailability={attachmentAvailability}
    />
  );
}

function AttachmentPreviewCard({
  attachment,
  removeLabel,
  retryLabel,
  uploadingLabel,
  failedLabel,
  disabled,
  onRemove,
  onRetry,
}: {
  attachment: StagingAttachmentItem;
  removeLabel: string;
  retryLabel: string;
  uploadingLabel: string;
  failedLabel: string;
  disabled?: boolean;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const { file, previewUrl, status, progress, error } = attachment;

  return (
    <article
      className={cn(
        CARD_WIDTH_CLASS,
        "flex h-[11.25rem] shrink-0 flex-col overflow-hidden rounded-2xl border border-input bg-card shadow-xs",
      )}
    >
      <div className="relative min-h-0 flex-1 bg-muted/40">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob preview URL
          <img src={previewUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <FileText className="size-8" />
          </div>
        )}

        {status === "uploading" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 px-3 text-center">
            <Loader2 className="mb-2 size-5 animate-spin text-primary" />
            <span className="text-[10px] font-semibold text-foreground">{uploadingLabel}</span>
            <span className="mt-1 text-[10px] text-muted-foreground">{progress}%</span>
          </div>
        ) : null}

        {status === "failed" ? (
          <div className="absolute inset-x-0 bottom-0 space-y-1 bg-destructive/90 px-2 py-2 text-center">
            <p className="line-clamp-2 text-[10px] font-semibold text-destructive-foreground">
              {error ?? failedLabel}
            </p>
            <Button
              type="button"
              size="xs"
              variant="secondary"
              disabled={disabled}
              className="h-6 px-2 text-[10px]"
              onClick={onRetry}
            >
              <RotateCcw className="mr-1 size-3" />
              {retryLabel}
            </Button>
          </div>
        ) : null}

        <Button
          type="button"
          size="icon-xs"
          variant="secondary"
          disabled={disabled || status === "uploading"}
          className="absolute top-1.5 right-1.5 size-6 border border-border/60 bg-card/90 text-muted-foreground shadow-xs hover:text-foreground"
          aria-label={removeLabel}
          onClick={onRemove}
        >
          <X className="size-3" />
        </Button>
      </div>
      <div className="shrink-0 border-t border-input bg-background/80 px-2.5 py-2 dark:bg-input/30">
        <p className="line-clamp-2 text-[11px] leading-4 font-semibold text-foreground">{file.name}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
      </div>
    </article>
  );
}

/** Local-only file picker (no pre-upload). Used by issue screenshots. */
export function LocalFileAttachmentDropzone({
  value,
  onChange,
  attachmentAvailability,
  disabled = false,
  accept = "image/*,.pdf,.doc,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  maxFiles = MAX_REQUEST_ATTACHMENT_FILES,
  maxTotalBytes = MAX_REQUEST_ATTACHMENT_TOTAL_BYTES,
  fullWidth = false,
  labels,
}: {
  value: File[];
  onChange: (files: File[]) => void;
  attachmentAvailability?: PublicAttachmentAvailability;
  disabled?: boolean;
  accept?: string;
  maxFiles?: number;
  maxTotalBytes?: number | null;
  fullWidth?: boolean;
  labels?: {
    title?: string;
    hint?: string;
    addFile?: string;
    fileCount?: FileCountLabel;
    remove?: string;
    maxFiles?: string;
    maxSize?: string;
  };
}) {
  const t = useTranslations("estimateRequests.attachments");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  type LocalAttachment = { id: string; file: File; previewUrl: string | null };

  function fileId(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  const files: LocalAttachment[] = value.map((file) => ({
    id: fileId(file),
    file,
    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
  }));

  const copy = {
    title: labels?.title ?? t("title"),
    hint: labels?.hint ?? t("hint"),
    addFile: labels?.addFile ?? t("addFile"),
    fileCount: labels?.fileCount ?? ((current, max) => t("fileCount", { current, max })),
    remove: labels?.remove ?? t("remove"),
    maxFiles: labels?.maxFiles ?? t("errors.maxFiles"),
    maxSize: labels?.maxSize ?? t("errors.maxSize"),
  };

  const uploadsAvailable =
    attachmentAvailability === undefined || isAttachmentUploadAvailable(attachmentAvailability);

  if (!uploadsAvailable) {
    return (
      <div className="space-y-2">
        <div className="flex min-h-24 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-input bg-muted/30 px-4 py-5 text-center opacity-80">
          <span className="text-xs font-semibold text-foreground">{t("unavailableTitle")}</span>
          <span className="mt-1 text-[10px] text-muted-foreground">{t("unavailableHint")}</span>
        </div>
      </div>
    );
  }

  function addFiles(fileList: FileList | null) {
    if (disabled || !fileList) return;
    setError(null);
    const incoming = Array.from(fileList);
    const existingIds = new Set(value.map(fileId));
    const uniqueIncoming = incoming.filter((file) => !existingIds.has(fileId(file)));
    if (value.length + uniqueIncoming.length > maxFiles) {
      setError(copy.maxFiles);
      return;
    }
    const nextFiles = [...value, ...uniqueIncoming];
    const totalBytes = nextFiles.reduce((sum, file) => sum + file.size, 0);
    if (maxTotalBytes !== null && totalBytes > maxTotalBytes) {
      setError(copy.maxSize);
      return;
    }
    onChange(nextFiles);
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <div className={cn("w-full overflow-x-auto pb-1", !fullWidth && "max-w-[calc(4*10.5rem+3*0.5rem)]")}>
        <div className="flex w-max gap-2">
          <button
            type="button"
            disabled={disabled || value.length >= maxFiles}
            onClick={() => inputRef.current?.click()}
            className={cn(CARD_WIDTH_CLASS, "flex h-[11.25rem] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-input bg-background/60 text-center shadow-xs")}
          >
            <Plus className="size-5" />
            <span className="text-xs font-semibold">{copy.addFile}</span>
          </button>
          {files.map((attachment) => (
            <article key={attachment.id} className={cn(CARD_WIDTH_CLASS, "flex h-[11.25rem] shrink-0 flex-col overflow-hidden rounded-2xl border border-input bg-card shadow-xs")}>
              <div className="relative min-h-0 flex-1 bg-muted/40">
                {attachment.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={attachment.previewUrl} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <FileText className="size-8" />
                  </div>
                )}
                <Button type="button" size="icon-xs" variant="secondary" disabled={disabled} className="absolute top-1.5 right-1.5 size-6" aria-label={copy.remove} onClick={() => onChange(value.filter((file) => fileId(file) !== attachment.id))}>
                  <X className="size-3" />
                </Button>
              </div>
              <div className="shrink-0 border-t border-input px-2.5 py-2">
                <p className="line-clamp-2 text-[11px] font-semibold">{attachment.file.name}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
