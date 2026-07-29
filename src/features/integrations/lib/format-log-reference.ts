/** Display label for IntegrationRequestLog.reference JSON. */
export function formatIntegrationLogReference(
  reference: unknown,
): string | null {
  if (!reference || typeof reference !== "object") {
    return null;
  }
  const record = reference as Record<string, unknown>;
  if (record.type === "estimate_request" && typeof record.requestNumber === "string") {
    return record.requestNumber;
  }
  if (typeof record.requestNumber === "string") {
    return record.requestNumber;
  }
  if (typeof record.label === "string") {
    return record.label;
  }
  return null;
}
