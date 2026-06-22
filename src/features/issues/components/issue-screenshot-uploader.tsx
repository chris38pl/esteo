"use client";

import { useTranslations } from "next-intl";

import { AttachmentDropzone } from "@/features/estimate-requests/components/attachment-dropzone-placeholder";
import { MAX_SINGLE_FILE_BYTES } from "@/features/attachments/lib/constants";
import type { StagingAttachmentItem } from "@/features/attachments/lib/staging-attachment-client";
import { issueFormLabelClassName } from "@/features/issues/components/issue-form-fields";
import { Label } from "@/components/ui/label";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_FILES = 10;

export function IssueScreenshotUploader({
  items,
  onAddFiles,
  onRemove,
  onRetry,
  localError,
  disabled,
}: {
  items: StagingAttachmentItem[];
  onAddFiles: (files: FileList | null) => void;
  onRemove: (clientId: string) => void;
  onRetry: (clientId: string) => void;
  localError: string | null;
  disabled?: boolean;
}) {
  const t = useTranslations("issues");

  const localErrorMessage =
    localError === "maxFiles"
      ? t("attachments.errors.maxFiles")
      : localError === "maxSize"
        ? t("attachments.errors.maxSize")
        : null;

  return (
    <div className="space-y-2">
      <Label className={issueFormLabelClassName}>{t("attachments.label")}</Label>
      <AttachmentDropzone
        items={items}
        onAddFiles={onAddFiles}
        onRemove={onRemove}
        onRetry={onRetry}
        disabled={disabled}
        accept={ACCEPT}
        maxFiles={MAX_FILES}
        maxTotalBytes={MAX_FILES * MAX_SINGLE_FILE_BYTES}
        fullWidth
        localError={localErrorMessage}
        labels={{
          title: t("attachments.title"),
          hint: t("attachments.hint"),
          addFile: t("attachments.addFile"),
          fileCount: (current, max) => t("attachments.fileCount", { current, max }),
          remove: t("attachments.remove"),
          retry: t("attachments.retry"),
          uploading: t("attachments.uploading"),
          failed: t("attachments.failed"),
          maxFiles: t("attachments.errors.maxFiles"),
          maxSize: t("attachments.errors.maxSize"),
        }}
      />
    </div>
  );
}
