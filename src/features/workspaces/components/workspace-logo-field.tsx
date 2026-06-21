"use client";

import Image from "next/image";
import { Loader2, UploadCloud } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { RemoveWorkspaceLogoDialog } from "@/features/workspaces/components/remove-workspace-logo-dialog";
import { LOGO_ACCEPT_TYPES } from "@/features/workspaces/lib/logo-constants";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type UploadState = "idle" | "uploading" | "error";

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
}: {
  workspaceId: string;
  initialLogoUrl: string | null;
  locale: Locale;
  label?: ReactNode;
}) {
  const t = useTranslations("workspaces.settings.logo");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setLogoUrl(initialLogoUrl);
  }, [initialLogoUrl]);

  const isUploading = uploadState === "uploading";
  const hasLogo = Boolean(logoUrl);

  async function handleFile(file: File | null) {
    if (!file || isUploading) {
      return;
    }

    setError(null);
    setUploadState("uploading");
    setUploadProgress(0);

    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("file", file);

    try {
      const result = await uploadLogoWithProgress(formData, setUploadProgress);
      setLogoUrl(result.logoUrl);
      setUploadState("idle");
      setUploadProgress(null);
      router.refresh();
    } catch (uploadError) {
      setUploadState("error");
      setUploadProgress(null);
      setError(
        uploadError instanceof Error ? uploadError.message : t("errors.uploadFailed"),
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
                    onClick={() => inputRef.current?.click()}
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
        onRemoved={() => setLogoUrl(null)}
      />
    </div>
  );
}
