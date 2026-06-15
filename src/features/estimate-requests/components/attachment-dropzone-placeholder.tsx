"use client";

import { FileText, Plus, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { PublicAttachmentAvailability } from "@/features/attachments/lib/attachment-availability";
import { isAttachmentUploadAvailable } from "@/features/attachments/lib/attachment-availability";
import {
  MAX_REQUEST_ATTACHMENT_FILES,
  MAX_REQUEST_ATTACHMENT_TOTAL_BYTES,
} from "@/features/attachments/lib/request-limits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const CARD_WIDTH_CLASS = "w-[10.5rem]";

type LocalAttachment = {
  id: string;
  file: File;
  previewUrl: string | null;
};

function fileId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function toAttachment(file: File): LocalAttachment {
  return {
    id: fileId(file),
    file,
    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
  };
}

function filesToLocalAttachments(files: File[]): LocalAttachment[] {
  return files.map(toAttachment);
}

export function AttachmentDropzone({
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
    fileCount?: string;
    remove?: string;
    maxFiles?: string;
    maxSize?: string;
  };
}) {
  const t = useTranslations("estimateRequests.attachments");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const files = filesToLocalAttachments(value);
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const copy = {
    title: labels?.title ?? t("title"),
    hint: labels?.hint ?? t("hint"),
    addFile: labels?.addFile ?? t("addFile"),
    fileCount: labels?.fileCount ?? t("fileCount"),
    remove: labels?.remove ?? t("remove"),
    maxFiles: labels?.maxFiles ?? t("errors.maxFiles"),
    maxSize: labels?.maxSize ?? t("errors.maxSize"),
  };

  const uploadsAvailable =
    attachmentAvailability === undefined || isAttachmentUploadAvailable(attachmentAvailability);

  useEffect(() => {
    return () => {
      for (const attachment of filesRef.current) {
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

  function addFiles(fileList: FileList | null) {
    if (disabled) {
      return;
    }

    setError(null);

    if (!fileList) {
      return;
    }

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

  function removeFile(id: string) {
    if (disabled) {
      return;
    }

    const removed = files.find((item) => item.id === id);
    if (removed?.previewUrl) {
      URL.revokeObjectURL(removed.previewUrl);
    }

    onChange(value.filter((file) => fileId(file) !== id));
  }

  function openFilePicker() {
    if (disabled || value.length >= maxFiles) {
      return;
    }

    inputRef.current?.click();
  }

  const canAddMore = value.length < maxFiles;

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

      {files.length === 0 ? (
        <button
          type="button"
          onClick={openFilePicker}
          disabled={disabled}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(event.dataTransfer.files);
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
            addFiles(event.dataTransfer.files);
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
                {copy.fileCount
                  .replace("{current}", String(files.length))
                  .replace("{max}", String(maxFiles))}
              </span>
            </button>

            {files.map((attachment) => (
              <AttachmentPreviewCard
                key={attachment.id}
                attachment={attachment}
                removeLabel={copy.remove}
                disabled={disabled}
                onRemove={() => removeFile(attachment.id)}
              />
            ))}
          </div>
        </div>
      )}

      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}

/** @deprecated Use AttachmentDropzone with value/onChange */
export function AttachmentDropzonePlaceholder({
  attachmentAvailability,
}: {
  attachmentAvailability?: PublicAttachmentAvailability;
}) {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <AttachmentDropzone
      value={files}
      onChange={setFiles}
      attachmentAvailability={attachmentAvailability}
    />
  );
}

function AttachmentPreviewCard({
  attachment,
  removeLabel,
  disabled,
  onRemove,
}: {
  attachment: LocalAttachment;
  removeLabel: string;
  disabled?: boolean;
  onRemove: () => void;
}) {
  const { file, previewUrl } = attachment;

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
        <Button
          type="button"
          size="icon-xs"
          variant="secondary"
          disabled={disabled}
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

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
