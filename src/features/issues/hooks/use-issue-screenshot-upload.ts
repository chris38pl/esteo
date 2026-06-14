"use client";

import { useCallback, useState } from "react";

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

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Upload failed.");
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
