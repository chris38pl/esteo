"use client";

import { useCallback, useState } from "react";

async function readUploadErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const body = (await response.json()) as { error?: string };
      return body.error ?? `Upload failed (${response.status}).`;
    } catch {
      return `Upload failed (${response.status}).`;
    }
  }

  return `Upload failed (${response.status}).`;
}

export function useIssueScreenshotUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadScreenshots = useCallback(async (issueId: string, files: File[]) => {
    if (files.length === 0) {
      return { success: true as const };
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("issueId", issueId);

      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch("/api/attachments/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readUploadErrorMessage(response));
      }

      return { success: true as const };
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Upload failed.";
      setError(message);
      return { success: false as const, error: message };
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadScreenshots, uploading, error };
}
