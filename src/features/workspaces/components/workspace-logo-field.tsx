"use client";

import Image from "next/image";
import { Check, Info, Loader2, Pencil, Trash2, UploadCloud } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { RemoveWorkspaceLogoDialog } from "@/features/workspaces/components/remove-workspace-logo-dialog";
import {
  LOGO_ACCEPT_TYPES,
  MAX_LOGO_RAW_BYTES,
} from "@/features/workspaces/lib/logo-constants";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type UploadState = "idle" | "uploading" | "error";

type LogoFileMeta = {
  format: string;
  sizeBytes: number;
  width: number;
  height: number;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeToFormatLabel(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "PNG";
    case "image/jpeg":
      return "JPG";
    case "image/webp":
      return "WebP";
    default:
      return mimeType.split("/")[1]?.toUpperCase() ?? "IMG";
  }
}

async function readImageDimensions(
  source: File | string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = typeof source === "string" ? source : URL.createObjectURL(source);
    const image = new window.Image();

    image.onload = () => {
      if (typeof source !== "string") {
        URL.revokeObjectURL(objectUrl);
      }
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      if (typeof source !== "string") {
        URL.revokeObjectURL(objectUrl);
      }
      reject(new Error("Failed to read image dimensions."));
    };

    image.src = objectUrl;
  });
}

function uploadLogoWithProgress(
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<{ logoUrl: string; logoStorageKey: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/workspaces/logo/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as {
          logoUrl?: string;
          logoStorageKey?: string;
          error?: string;
        };

        if (
          xhr.status >= 200 &&
          xhr.status < 300 &&
          body.logoUrl &&
          body.logoStorageKey
        ) {
          resolve({
            logoUrl: body.logoUrl,
            logoStorageKey: body.logoStorageKey,
          });
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

export function WorkspaceLogoField({
  workspaceId,
  initialLogoUrl,
  locale,
  label,
  variant = "default",
  onLogoUpdated,
}: {
  workspaceId: string;
  initialLogoUrl: string | null;
  locale: Locale;
  label?: ReactNode;
  variant?: "default" | "settings";
  onLogoUpdated?: (logo: { logoUrl: string | null; logoStorageKey: string | null }) => void;
}) {
  const t = useTranslations("workspaces.settings.logo");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [fileMeta, setFileMeta] = useState<LogoFileMeta | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setLogoUrl(initialLogoUrl);
  }, [initialLogoUrl]);

  useEffect(() => {
    if (!initialLogoUrl) {
      setFileMeta(null);
      return;
    }

    let cancelled = false;

    void readImageDimensions(initialLogoUrl)
      .then((dimensions) => {
        if (cancelled) {
          return;
        }

        setFileMeta((current) => {
          if (current && current.sizeBytes > 0) {
            return {
              ...current,
              width: dimensions.width,
              height: dimensions.height,
            };
          }

          const extension = initialLogoUrl.split(".").pop()?.toLowerCase();
          const format =
            extension === "png"
              ? "PNG"
              : extension === "jpg" || extension === "jpeg"
                ? "JPG"
                : extension === "webp"
                  ? "WebP"
                  : "IMG";

          return {
            format,
            sizeBytes: 0,
            width: dimensions.width,
            height: dimensions.height,
          };
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFileMeta((current) => (current?.sizeBytes ? current : null));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialLogoUrl]);

  const isUploading = uploadState === "uploading";
  const hasLogo = Boolean(logoUrl);

  function resolveUploadErrorMessage(message: string) {
    if (message === "File is too large.") {
      return t("errors.tooLarge");
    }

    if (message === "Upload failed.") {
      return t("errors.uploadFailed");
    }

    return message;
  }

  async function handleFile(file: File | null) {
    if (!file || isUploading) {
      return;
    }

    if (file.size > MAX_LOGO_RAW_BYTES) {
      setUploadState("error");
      setError(t("errors.tooLarge"));
      return;
    }

    setError(null);
    setUploadState("uploading");
    setUploadProgress(0);

    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("file", file);

    try {
      const [result, dimensions] = await Promise.all([
        uploadLogoWithProgress(formData, setUploadProgress),
        readImageDimensions(file),
      ]);

      setLogoUrl(result.logoUrl);
      setFileMeta({
        format: mimeToFormatLabel(file.type),
        sizeBytes: file.size,
        width: dimensions.width,
        height: dimensions.height,
      });
      setUploadState("idle");
      setUploadProgress(null);
      onLogoUpdated?.({
        logoUrl: result.logoUrl,
        logoStorageKey: result.logoStorageKey,
      });
      router.refresh();
    } catch (uploadError) {
      setUploadState("error");
      setUploadProgress(null);
      setError(
        resolveUploadErrorMessage(
          uploadError instanceof Error
            ? uploadError.message
            : t("errors.uploadFailed"),
        ),
      );
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    void handleFile(file);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (isUploading) {
      return;
    }

    const file = event.dataTransfer.files[0] ?? null;
    void handleFile(file);
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleRemoved() {
    setLogoUrl(null);
    setFileMeta(null);
    onLogoUpdated?.({ logoUrl: null, logoStorageKey: null });
  }

  const fileMetaCompact = fileMeta
    ? fileMeta.sizeBytes > 0
      ? `${fileMeta.format} • ${formatFileSize(fileMeta.sizeBytes)} ${fileMeta.width}x${fileMeta.height}`
      : `${fileMeta.format} ${fileMeta.width}x${fileMeta.height}`
    : null;

  if (variant === "settings") {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          {label ?? <Label className="text-base font-medium">{t("label")}</Label>}
          <p className="text-sm text-muted-foreground">{t("settingsSubtitle")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              if (!isUploading) {
                setIsDragging(true);
              }
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex h-36 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-center transition-colors dark:bg-muted/20",
              isDragging && "border-primary/50 bg-primary/5",
              isUploading && "pointer-events-none opacity-70",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept={LOGO_ACCEPT_TYPES}
              className="sr-only"
              disabled={isUploading}
              onChange={handleInputChange}
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t("uploading", { percent: uploadProgress ?? 0 })}
                </p>
                {uploadProgress !== null ? (
                  <div className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={openFilePicker}
                className="flex w-full cursor-pointer flex-col items-center gap-3"
              >
                <UploadCloud className="size-8 text-primary" strokeWidth={1.5} />
                <span className="text-sm font-medium text-primary">{t("addLogo")}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {t("hintShort")}
                </span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex h-36 items-stretch gap-3">
              <div
                className={cn(
                  "relative size-36 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-background",
                  !hasLogo && "border-dashed bg-muted/20",
                )}
              >
                {hasLogo && logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt=""
                    fill
                    sizes="144px"
                    className="object-contain p-1.5"
                    unoptimized
                  />
                ) : null}
              </div>

              {hasLogo ? (
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 self-stretch">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto min-h-0 flex-1 gap-1.5 rounded-sm px-2.5 text-xs font-normal"
                    disabled={isUploading}
                    onClick={openFilePicker}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    {t("changeShort")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto min-h-0 flex-1 gap-1.5 rounded-sm px-2.5 text-xs font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={isUploading}
                    onClick={() => setRemoveDialogOpen(true)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {t("removeShort")}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 dark:bg-muted/20">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("formatRecommendation")}
          </p>
        </div>

        {hasLogo ? (
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 dark:bg-muted/20">
            <Check
              className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden
            />
            <p className="text-xs leading-relaxed">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {t("uploadedStatus")}
              </span>
              {fileMetaCompact ? (
                <span className="text-muted-foreground"> ({fileMetaCompact})</span>
              ) : null}
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <RemoveWorkspaceLogoDialog
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          workspaceId={workspaceId}
          locale={locale}
          onRemoved={handleRemoved}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {label ?? <Label>{t("label")}</Label>}
        <p className="text-sm text-muted-foreground">{t("hint")}</p>
      </div>

      <div className="flex items-stretch gap-3">
        <div
          className={cn(
            "relative size-24 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/20",
            !hasLogo && "border-dashed",
          )}
        >
          {hasLogo && logoUrl ? (
            <Image
              src={logoUrl}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          ) : null}
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!isUploading) {
              setIsDragging(true);
            }
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex min-h-24 min-w-0 flex-1 flex-col justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 px-3 py-3 transition-colors sm:px-4",
            isDragging && "border-primary/50 bg-primary/5",
            isUploading && "pointer-events-none opacity-70",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={LOGO_ACCEPT_TYPES}
            className="sr-only"
            disabled={isUploading}
            onChange={handleInputChange}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("uploading", { percent: uploadProgress ?? 0 })}
              </p>
              {uploadProgress !== null ? (
                <div className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <UploadCloud
                className="size-8 shrink-0 text-muted-foreground/50"
                strokeWidth={1.5}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground/90">{t("dropHint")}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={openFilePicker}
                  >
                    {hasLogo ? t("change") : t("upload")}
                  </Button>
                  {hasLogo ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setRemoveDialogOpen(true)}
                    >
                      {t("remove")}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <RemoveWorkspaceLogoDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        workspaceId={workspaceId}
        locale={locale}
        onRemoved={handleRemoved}
      />
    </div>
  );
}
