export type StagingAttachmentUiStatus = "uploading" | "uploaded" | "failed";

export type StagingAttachmentItem = {
  clientId: string;
  attachmentId: string | null;
  file: File;
  previewUrl: string | null;
  status: StagingAttachmentUiStatus;
  progress: number;
  error: string | null;
};

export function mapDbStatusToUi(
  status: "UPLOADING" | "PENDING" | "FAILED" | "LINKED",
): StagingAttachmentUiStatus {
  if (status === "PENDING" || status === "LINKED") {
    return "uploaded";
  }

  if (status === "FAILED") {
    return "failed";
  }

  return "uploading";
}
