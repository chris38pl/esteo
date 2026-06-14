"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_FILES = 10;

export function IssueScreenshotUploader({
  files,
  onChange,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("issues");
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  function addFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) {
      return;
    }

    const next = [...files];
    const nextPreviews = [...previews];

    for (const file of Array.from(selected)) {
      if (next.length >= MAX_FILES) {
        break;
      }

      next.push(file);
      nextPreviews.push(URL.createObjectURL(file));
    }

    onChange(next);
    setPreviews(nextPreviews);
  }

  function removeAt(index: number) {
    const previewUrl = previews[index];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    onChange(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <Label>{t("form.screenshots")}</Label>
      <div className="flex flex-wrap gap-2">
        {previews.map((preview, index) => (
          <div key={preview} className="relative size-20 overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="size-full object-cover" />
            <button
              type="button"
              className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5"
              onClick={() => removeAt(index)}
              disabled={disabled}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {files.length < MAX_FILES ? (
          <Button
            type="button"
            variant="outline"
            className="size-20 flex-col gap-1"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            <span className="text-[10px]">{t("form.addScreenshot")}</span>
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
