"use client";

import { FileText, ImageIcon, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;

type LocalAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
};

export function AttachmentDropzonePlaceholder() {
  const t = useTranslations("estimateRequests.attachments");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<LocalAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  function addFiles(fileList: FileList | null) {
    setError(null);

    if (!fileList) {
      return;
    }

    const incoming = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    const next = [...files, ...incoming].slice(0, MAX_FILES);
    const totalBytes = next.reduce((sum, file) => sum + file.size, 0);

    if (files.length + incoming.length > MAX_FILES) {
      setError(t("errors.maxFiles"));
      return;
    }

    if (totalBytes > MAX_TOTAL_BYTES) {
      setError(t("errors.maxSize"));
      return;
    }

    setFiles(next);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-24 w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/10",
          "bg-white/[0.02] px-4 py-5 text-center transition hover:border-orange-400/50 hover:bg-orange-500/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30",
        )}
      >
        <span className="mb-3 grid size-9 place-items-center rounded-full border border-orange-400/30 bg-orange-500/10 text-orange-400">
          <UploadCloud className="size-4" />
        </span>
        <span className="text-xs font-semibold text-white">{t("title")}</span>
        <span className="mt-1 text-[10px] text-slate-500">{t("hint")}</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={(event) => addFiles(event.target.files)}
      />

      {files.length > 0 ? (
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex min-w-0 gap-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex w-44 shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-2"
              >
                <div className="grid size-8 shrink-0 place-items-center rounded-md bg-orange-500/10 text-orange-400">
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="size-4" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-white">{file.name}</p>
                  <p className="text-[10px] text-slate-500">{formatBytes(file.size)}</p>
                </div>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="size-6 text-slate-400 hover:text-white"
                  aria-label={t("remove")}
                  onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-[11px] text-orange-300">{error}</p> : null}
      <p className="text-[10px] leading-4 text-slate-500">{t("notUploadedYet")}</p>
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
