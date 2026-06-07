import {
  MAX_FILES_PER_UPLOAD_BATCH,
  MAX_SINGLE_FILE_BYTES,
} from "@/features/attachments/lib/constants";
import { formatBytes } from "@/features/attachments/lib/format-bytes";
import {
  StorageQuotaError,
  type WorkspaceStorageFields,
  type WorkspaceStorageLevel,
  type WorkspaceStorageSummary,
} from "@/features/attachments/server/storage-errors";

export function assertSingleFileSize(rawBytes: number): void {
  if (rawBytes > MAX_SINGLE_FILE_BYTES) {
    throw new StorageQuotaError(
      `File exceeds the ${formatBytes(MAX_SINGLE_FILE_BYTES)} limit.`,
      "FILE_TOO_LARGE",
    );
  }
}

export function assertBatchFileCount(count: number): void {
  if (count > MAX_FILES_PER_UPLOAD_BATCH) {
    throw new StorageQuotaError(
      `Cannot upload more than ${MAX_FILES_PER_UPLOAD_BATCH} files at once.`,
      "BATCH_FILE_COUNT",
    );
  }
}

export function assertWorkspaceHasStorageCapacity(
  workspace: WorkspaceStorageFields,
  additionalStoredBytes: number,
): void {
  const used = workspace.attachmentStorageUsedBytes;
  const limit = workspace.attachmentStorageLimitBytes;
  const next = used + BigInt(additionalStoredBytes);

  if (next > limit) {
    throw new StorageQuotaError(
      "Workspace attachment storage limit reached.",
      "WORKSPACE_STORAGE_LIMIT",
    );
  }
}

export function getWorkspaceStorageLevel(
  workspace: WorkspaceStorageFields,
): WorkspaceStorageLevel {
  const used = workspace.attachmentStorageUsedBytes;
  const limit = workspace.attachmentStorageLimitBytes;

  if (limit <= BigInt(0)) {
    return "exhausted";
  }

  if (used >= limit) {
    return "exhausted";
  }

  const usedPercent = Number((used * BigInt(10000)) / limit) / 100;

  if (usedPercent >= 80) {
    return "approaching_limit";
  }

  return "ok";
}

export function canAcceptAttachments(workspace: WorkspaceStorageFields): boolean {
  return getWorkspaceStorageLevel(workspace) !== "exhausted";
}

export function getWorkspaceStorageSummary(
  workspace: WorkspaceStorageFields,
): WorkspaceStorageSummary {
  const usedBytes = workspace.attachmentStorageUsedBytes;
  const limitBytes = workspace.attachmentStorageLimitBytes;
  const usedPercent =
    limitBytes > BigInt(0)
      ? Math.min(100, Number((usedBytes * BigInt(10000)) / limitBytes) / 100)
      : 100;

  return {
    usedBytes,
    limitBytes,
    usedFormatted: formatBytes(usedBytes),
    limitFormatted: formatBytes(limitBytes),
    usedPercent,
    level: getWorkspaceStorageLevel(workspace),
  };
}
