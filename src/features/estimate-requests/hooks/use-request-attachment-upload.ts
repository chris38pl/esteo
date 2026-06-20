"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { StagingAttachmentItem } from "@/features/attachments/lib/staging-attachment-client";
import {
  MAX_REQUEST_ATTACHMENT_FILES,
  MAX_REQUEST_ATTACHMENT_TOTAL_BYTES,
} from "@/features/attachments/lib/request-limits";

type UploadResponse = {
  attachmentId: string;
  status: "UPLOADING" | "PENDING" | "FAILED";
  error?: string;
};

function fileClientId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;
}

function uploadStagingFile(input: {
  endpoint: string;
  file: File;
  attachmentId?: string;
  workspaceSlug?: string;
  workspaceId?: string;
  onProgress: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.set("file", input.file);

    if (input.workspaceSlug) {
      formData.set("workspaceSlug", input.workspaceSlug);
    }

    if (input.workspaceId) {
      formData.set("workspaceId", input.workspaceId);
    }

    if (input.attachmentId) {
      formData.set("attachmentId", input.attachmentId);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", input.endpoint);

    if (input.signal) {
      input.signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        input.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as UploadResponse & { error?: string };

        if (xhr.status >= 200 && xhr.status < 300 && body.attachmentId) {
          resolve(body);
          return;
        }

        reject(new Error(body.error ?? "Upload failed."));
      } catch {
        reject(new Error("Upload failed."));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.onabort = () => reject(new Error("Upload aborted."));
    xhr.send(formData);
  });
}

export function useRequestAttachmentUpload(input: {
  uploadEndpoint: string;
  deleteEndpointBase: string;
  workspaceSlug?: string;
  workspaceId?: string;
  maxFiles?: number;
  maxTotalBytes?: number;
}) {
  const [items, setItems] = useState<StagingAttachmentItem[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const maxFiles = input.maxFiles ?? MAX_REQUEST_ATTACHMENT_FILES;
  const maxTotalBytes = input.maxTotalBytes ?? MAX_REQUEST_ATTACHMENT_TOTAL_BYTES;

  const attachmentIds = useMemo(
    () =>
      items
        .filter((item) => item.status === "uploaded" && item.attachmentId)
        .map((item) => item.attachmentId as string),
    [items],
  );

  const isUploading = items.some((item) => item.status === "uploading");
  const hasFailed = items.some((item) => item.status === "failed");

  const canSubmitAttachments = !isUploading && !hasFailed;

  const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0);

  const updateItem = useCallback((clientId: string, patch: Partial<StagingAttachmentItem>) => {
    setItems((current) =>
      current.map((item) => (item.clientId === clientId ? { ...item, ...patch } : item)),
    );
  }, []);

  const startUpload = useCallback(
    async (clientId: string, file: File, retryAttachmentId?: string) => {
      const controller = new AbortController();
      abortControllersRef.current.set(clientId, controller);

      updateItem(clientId, {
        status: "uploading",
        progress: 0,
        error: null,
        attachmentId: retryAttachmentId ?? null,
      });

      try {
        const result = await uploadStagingFile({
          endpoint: input.uploadEndpoint,
          file,
          attachmentId: retryAttachmentId,
          workspaceSlug: input.workspaceSlug,
          workspaceId: input.workspaceId,
          signal: controller.signal,
          onProgress: (percent) => updateItem(clientId, { progress: percent }),
        });

        updateItem(clientId, {
          attachmentId: result.attachmentId,
          status: result.status === "PENDING" ? "uploaded" : "failed",
          progress: result.status === "PENDING" ? 100 : 0,
          error: result.error ?? null,
        });
      } catch (error) {
        if (error instanceof Error && error.message === "Upload aborted.") {
          return;
        }

        updateItem(clientId, {
          status: "failed",
          progress: 0,
          error: error instanceof Error ? error.message : "Upload failed.",
        });
      } finally {
        abortControllersRef.current.delete(clientId);
      }
    },
    [input.uploadEndpoint, input.workspaceId, input.workspaceSlug, updateItem],
  );

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      setLocalError(null);

      if (!fileList) {
        return;
      }

      const incoming = Array.from(fileList);

      if (items.length + incoming.length > maxFiles) {
        setLocalError("maxFiles");
        return;
      }

      const nextTotal = totalBytes + incoming.reduce((sum, file) => sum + file.size, 0);

      if (nextTotal > maxTotalBytes) {
        setLocalError("maxSize");
        return;
      }

      const newItems: StagingAttachmentItem[] = incoming.map((file) => ({
        clientId: fileClientId(file),
        attachmentId: null,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        status: "uploading",
        progress: 0,
        error: null,
      }));

      setItems((current) => [...current, ...newItems]);

      for (const item of newItems) {
        void startUpload(item.clientId, item.file);
      }
    },
    [items.length, maxFiles, maxTotalBytes, startUpload, totalBytes],
  );

  const remove = useCallback(
    async (clientId: string) => {
      const item = items.find((entry) => entry.clientId === clientId);

      if (!item) {
        return;
      }

      const controller = abortControllersRef.current.get(clientId);

      if (controller) {
        controller.abort();
        abortControllersRef.current.delete(clientId);
      }

      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }

      setItems((current) => current.filter((entry) => entry.clientId !== clientId));

      if (item.attachmentId) {
        const query = input.workspaceSlug
          ? `?workspaceSlug=${encodeURIComponent(input.workspaceSlug)}`
          : input.workspaceId
            ? `?workspaceId=${encodeURIComponent(input.workspaceId)}`
            : "";

        await fetch(`${input.deleteEndpointBase}/${item.attachmentId}${query}`, {
          method: "DELETE",
        }).catch(() => undefined);
      }
    },
    [input.deleteEndpointBase, input.workspaceId, input.workspaceSlug, items],
  );

  const retry = useCallback(
    (clientId: string) => {
      const item = items.find((entry) => entry.clientId === clientId);

      if (!item || !item.attachmentId) {
        return;
      }

      void startUpload(item.clientId, item.file, item.attachmentId);
    },
    [items, startUpload],
  );

  const reset = useCallback(() => {
    for (const controller of abortControllersRef.current.values()) {
      controller.abort();
    }

    abortControllersRef.current.clear();

    for (const item of items) {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    }

    setItems([]);
    setLocalError(null);
  }, [items]);

  return {
    items,
    addFiles,
    remove,
    retry,
    reset,
    attachmentIds,
    isUploading,
    canSubmitAttachments,
    localError,
  };
}
