export class StorageQuotaError extends Error {
  readonly code: "WORKSPACE_STORAGE_LIMIT" | "FILE_TOO_LARGE" | "BATCH_FILE_COUNT";

  constructor(
    message: string,
    code: "WORKSPACE_STORAGE_LIMIT" | "FILE_TOO_LARGE" | "BATCH_FILE_COUNT",
  ) {
    super(message);
    this.name = "StorageQuotaError";
    this.code = code;
  }
}

export type WorkspaceStorageFields = {
  attachmentStorageUsedBytes: bigint;
  attachmentStorageLimitBytes: bigint;
};

export type WorkspaceStorageLevel = "ok" | "approaching_limit" | "exhausted";

export type WorkspaceStorageSummary = {
  usedBytes: bigint;
  limitBytes: bigint;
  usedFormatted: string;
  limitFormatted: string;
  usedPercent: number;
  level: WorkspaceStorageLevel;
};
