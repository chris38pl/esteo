import { randomUUID } from "crypto";

export type CorrelationIds = {
  httpRequestId: string;
  correlationId: string;
};

export function createCorrelationIds(request?: Request): CorrelationIds {
  const incoming =
    request?.headers.get("x-correlation-id")?.trim() ||
    request?.headers.get("x-request-id")?.trim() ||
    null;
  const id = incoming && incoming.length > 0 ? incoming.slice(0, 128) : `req_${randomUUID()}`;
  return {
    httpRequestId: id,
    correlationId: id,
  };
}

export function applyCorrelationHeaders(
  headers: Headers,
  ids: CorrelationIds,
): void {
  headers.set("X-Request-Id", ids.httpRequestId);
  headers.set("X-Correlation-Id", ids.correlationId);
}
