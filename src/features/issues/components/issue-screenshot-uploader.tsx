"use client";

import { useTranslations } from "next-intl";

import { LocalFileAttachmentDropzone } from "@/features/estimate-requests/components/attachment-dropzone-placeholder";
import { MAX_SINGLE_FILE_BYTES } from "@/features/attachments/lib/constants";
import { issueFormLabelClassName } from "@/features/issues/components/issue-form-fields";
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

  return (
    <div className="space-y-2">
      <Label className={issueFormLabelClassName}>{t("attachments.label")}</Label>
      <LocalFileAttachmentDropzone
        value={files}
        onChange={onChange}
        disabled={disabled}
        accept={ACCEPT}
        maxFiles={MAX_FILES}
        maxTotalBytes={MAX_FILES * MAX_SINGLE_FILE_BYTES}
        fullWidth
        labels={{
          title: t("attachments.title"),
          hint: t("attachments.hint"),
          addFile: t("attachments.addFile"),
          fileCount: (current, max) => t("attachments.fileCount", { current, max }),
          remove: t("attachments.remove"),
          maxFiles: t("attachments.errors.maxFiles"),
          maxSize: t("attachments.errors.maxSize"),
        }}
      />
    </div>
  );
}
