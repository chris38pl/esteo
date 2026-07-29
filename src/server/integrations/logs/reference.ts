/** Business object linked to an integration HTTP/UI call. */
export type IntegrationLogReference =
  | {
      type: "estimate_request";
      requestNumber: string;
      requestId: string;
    }
  | {
      type: string;
      [key: string]: unknown;
    };

export function estimateRequestLogReference(input: {
  requestId: string;
  requestNumber: string;
}): IntegrationLogReference {
  return {
    type: "estimate_request",
    requestId: input.requestId,
    requestNumber: input.requestNumber,
  };
}

export function referenceFromIdempotentBody(
  body: unknown,
): IntegrationLogReference | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const record = body as Record<string, unknown>;
  const requestId = typeof record.requestId === "string" ? record.requestId : null;
  const requestNumber =
    typeof record.requestNumber === "string" ? record.requestNumber : null;
  if (!requestId || !requestNumber) {
    return null;
  }
  return estimateRequestLogReference({ requestId, requestNumber });
}

export { formatIntegrationLogReference } from "@/features/integrations/lib/format-log-reference";
