export class StagingAttachmentError extends Error {
  constructor(
    message: string,
    readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "EXPIRED"
      | "INVALID_STATUS"
      | "OWNER_LIMIT"
      | "WORKSPACE_NOT_FOUND",
  ) {
    super(message);
    this.name = "StagingAttachmentError";
  }
}
