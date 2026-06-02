"use client";

import { FileText, Plus, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
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

export function AttachmentDropzonePlaceholder() {
  const t = useTranslations("estimateRequests.attachments");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<LocalAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(() => {
    return () => {
      for (const attachment of filesRef.current) {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      }
    };
  }, []);

  function addFiles(fileList: FileList | null) {
    setError(null);

    if (!fileList) {
      return;
    }

    const incoming = Array.from(fileList);
    const existingIds = new Set(files.map((item) => item.id));
    const uniqueIncoming = incoming.filter((file) => !existingIds.has(fileId(file)));

    if (files.length + uniqueIncoming.length > MAX_FILES) {
      setError(t("errors.maxFiles"));
      return;
    }

    const nextAttachments = [...files, ...uniqueIncoming.map(toAttachment)];
    const totalBytes = nextAttachments.reduce((sum, item) => sum + item.file.size, 0);

    if (totalBytes > MAX_TOTAL_BYTES) {
      for (const attachment of uniqueIncoming.map(toAttachment)) {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      }
      setError(t("errors.maxSize"));
      return;
    }

    setFiles(nextAttachments);
  }

  function removeFile(id: string) {
    setFiles((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  function openFilePicker() {
    if (files.length >= MAX_FILES) {
      return;
    }
    inputRef.current?.click();
  }

  const canAddMore = files.length < MAX_FILES;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {files.length === 0 ? (
        <button
          type="button"
          onClick={openFilePicker}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(event.dataTransfer.files);
          }}
          className={cn(
            "flex min-h-24 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-input",
            "bg-background/60 px-4 py-5 text-center shadow-xs transition hover:bg-accent/50 dark:bg-input/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          )}
        >
          <span className="mb-3 grid size-9 place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary">
            <UploadCloud className="size-4" />
          </span>
          <span className="text-xs font-semibold text-foreground">{t("title")}</span>
          <span className="mt-1 text-[10px] text-muted-foreground">{t("hint")}</span>
        </button>
      ) : (
        <div
          className="w-full max-w-[calc(4*10.5rem+3*0.5rem)] overflow-x-auto pb-1 sidebar-scroll"
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
              disabled={!canAddMore}
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
              <span className="text-xs font-semibold text-foreground">{t("addFile")}</span>
              <span className="mt-1 text-[10px] text-muted-foreground">
                {t("fileCount", { current: files.length, max: MAX_FILES })}
              </span>
            </button>

            {files.map((attachment) => (
              <AttachmentPreviewCard
                key={attachment.id}
                attachment={attachment}
                removeLabel={t("remove")}
                onRemove={() => removeFile(attachment.id)}
              />
            ))}
          </div>
        </div>
      )}

      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
      {files.length === 0 ? (
        <p className="text-[10px] leading-4 text-muted-foreground">{t("notUploadedYet")}</p>
      ) : null}
    </div>
  );
}

function AttachmentPreviewCard({
  attachment,
  removeLabel,
  onRemove,
}: {
  attachment: LocalAttachment;
  removeLabel: string;
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
