"use client";

import { useCallback, useState } from "react";

export type EstimateRequestSubmitResponse = {
  requestNumber: string;
  requestId: string;
  estimateId: string;
  attachmentWarnings?: string[];
};

export type EstimateRequestSubmitErrorCode =
  | "invalid"
  | "rate_limited"
  | "captcha_failed"
  | "storage_full"
  | "all_attachments_failed"
  | "unavailable";

export function useEstimateRequestSubmit(input: {
  endpoint: string;
  onSuccess?: (result: EstimateRequestSubmitResponse) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorCode, setErrorCode] = useState<EstimateRequestSubmitErrorCode | null>(null);
  const [attachmentWarnings, setAttachmentWarnings] = useState<string[]>([]);

  const submit = useCallback(
    (payload: Record<string, unknown>, files: File[], options?: { workspaceId?: string }) => {
      setIsSubmitting(true);
      setUploadProgress(files.length > 0 ? 0 : null);
      setErrorCode(null);
      setAttachmentWarnings([]);

      const formData = new FormData();
      formData.set("payload", JSON.stringify(payload));

      if (options?.workspaceId) {
        formData.set("workspaceId", options.workspaceId);
      }

      for (const file of files) {
        formData.append("files", file);
      }

      return new Promise<EstimateRequestSubmitResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", input.endpoint);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          setIsSubmitting(false);
          setUploadProgress(null);

          try {
            const body = JSON.parse(xhr.responseText) as {
              requestNumber?: string;
              requestId?: string;
              estimateId?: string;
              attachmentWarnings?: string[];
              error?: EstimateRequestSubmitErrorCode;
            };

            if (xhr.status >= 200 && xhr.status < 300 && body.requestNumber) {
              const result: EstimateRequestSubmitResponse = {
                requestNumber: body.requestNumber,
                requestId: body.requestId ?? "",
                estimateId: body.estimateId ?? "",
                attachmentWarnings: body.attachmentWarnings,
              };

              if (body.attachmentWarnings?.length) {
                setAttachmentWarnings(body.attachmentWarnings);
              }

              input.onSuccess?.(result);
              resolve(result);
              return;
            }

            const code = body.error ?? "unavailable";
            setErrorCode(code);
            reject(new Error(code));
          } catch {
            setErrorCode("unavailable");
            reject(new Error("unavailable"));
          }
        };

        xhr.onerror = () => {
          setIsSubmitting(false);
          setUploadProgress(null);
          setErrorCode("unavailable");
          reject(new Error("unavailable"));
        };

        xhr.send(formData);
      });
    },
    [input],
  );

  return {
    submit,
    isSubmitting,
    uploadProgress,
    errorCode,
    attachmentWarnings,
  };
}
