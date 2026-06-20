"use client";

import { useCallback, useState } from "react";

export type EstimateRequestSubmitResponse = {
  requestNumber: string;
  requestId: string;
  estimateId: string | null;
  queued?: boolean;
  attachmentWarnings?: string[];
};

export type EstimateRequestSubmitErrorCode =
  | "invalid"
  | "rate_limited"
  | "captcha_failed"
  | "storage_full"
  | "all_attachments_failed"
  | "attachments_not_ready"
  | "payload_too_large"
  | "unauthorized"
  | "forbidden"
  | "server_error"
  | "unavailable";

type SubmitResponseBody = {
  requestNumber?: string;
  requestId?: string;
  estimateId?: string | null;
  queued?: boolean;
  attachmentWarnings?: string[];
  error?: string;
};

const KNOWN_ERROR_CODES = new Set<string>([
  "invalid",
  "rate_limited",
  "captcha_failed",
  "storage_full",
  "all_attachments_failed",
  "attachments_not_ready",
  "payload_too_large",
  "unauthorized",
  "forbidden",
  "server_error",
  "unavailable",
]);

function isKnownErrorCode(value: string): value is EstimateRequestSubmitErrorCode {
  return KNOWN_ERROR_CODES.has(value);
}

function resolveSubmitErrorCode(
  status: number,
  body: SubmitResponseBody | null,
): EstimateRequestSubmitErrorCode {
  if (body?.error && isKnownErrorCode(body.error)) {
    return body.error;
  }

  if (status === 413) {
    return "payload_too_large";
  }

  if (status === 401) {
    return "unauthorized";
  }

  if (status === 403) {
    return "forbidden";
  }

  if (status === 500) {
    return "server_error";
  }

  return "unavailable";
}

export function useEstimateRequestSubmit(input: {
  endpoint: string;
  onSuccess?: (result: EstimateRequestSubmitResponse) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState<EstimateRequestSubmitErrorCode | null>(null);
  const [attachmentWarnings, setAttachmentWarnings] = useState<string[]>([]);

  const submit = useCallback(
    (
      payload: Record<string, unknown>,
      attachmentIds: string[],
      options?: { workspaceId?: string },
    ) => {
      setIsSubmitting(true);
      setErrorCode(null);
      setAttachmentWarnings([]);

      const bodyPayload = {
        ...payload,
        attachmentIds,
      };

      const requestBody = options?.workspaceId
        ? { workspaceId: options.workspaceId, payload: bodyPayload }
        : bodyPayload;

      return fetch(input.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      })
        .then(async (response) => {
          let body: SubmitResponseBody | null = null;

          try {
            body = (await response.json()) as SubmitResponseBody;
          } catch {
            const code = resolveSubmitErrorCode(response.status, null);
            setErrorCode(code);
            return null;
          }

          if (response.ok && body.requestNumber) {
            const result: EstimateRequestSubmitResponse = {
              requestNumber: body.requestNumber,
              requestId: body.requestId ?? "",
              estimateId: body.estimateId ?? null,
              queued: body.queued ?? false,
              attachmentWarnings: body.attachmentWarnings,
            };

            if (body.attachmentWarnings?.length) {
              setAttachmentWarnings(body.attachmentWarnings);
            }

            input.onSuccess?.(result);
            return result;
          }

          const code = resolveSubmitErrorCode(response.status, body);
          setErrorCode(code);
          return null;
        })
        .catch(() => {
          setErrorCode("unavailable");
          return null;
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    },
    [input],
  );

  return {
    submit,
    isSubmitting,
    errorCode,
    attachmentWarnings,
  };
}
