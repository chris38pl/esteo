import "server-only";

import { AttachmentThumbnailStatus, AttachmentType, AttachmentUploadSource } from "@prisma/client";
import { randomUUID } from "crypto";

import { ALLOWED_IMAGE_MIME_TYPES, isAllowedAttachmentMimeType } from "@/features/attachments/lib/allowed-mime-types";
import type { RequestAttachmentRecord } from "@/features/attachments/lib/request-attachment-metadata";
import { resolveAttachmentType } from "@/features/attachments/lib/resolve-attachment-type";
import { createAttachmentRecords } from "@/features/attachments/server/attachments-repository";
import {
  scheduleUpsertSearchDocumentForAttachment,
} from "@/features/search/server/index-service";
import {
  assertBatchFileCount,
  assertSingleFileSize,
  assertWorkspaceHasStorageCapacity,
} from "@/features/attachments/server/assert-workspace-storage";
import { enqueueAttachmentThumbnailGeneration } from "@/features/attachments/server/enqueue-attachment-thumbnails";
import {
  processDocxBuffer,
  processImageOriginal,
  processPdfBuffer,
} from "@/features/attachments/server/image-processor";
import { getWorkspaceStorageFields } from "@/features/attachments/server/public-attachment-availability";
import { getStorageProvider } from "@/features/attachments/server/storage";
import {
  getUploadDiagnosticLogPath,
  logUploadThingDiagnostic,
  setUploadDiagnosticBatchContext,
} from "@/features/attachments/server/storage/uploadthing-diagnostic";
import { StorageQuotaError } from "@/features/attachments/server/storage-errors";
import { syncEstimateAttachmentCount } from "@/features/attachments/server/sync-attachment-count";
import { incrementWorkspaceStorageUsed } from "@/features/attachments/server/usage-service";
import { prisma } from "@/db/client";
import { PermissionError } from "@/server/permissions/errors";

export type PreparedUploadFile = {
  id: string;
  originalFileName: string;
  mimeType: string;
  attachmentType: AttachmentType;
  storedBytes: number;
  storageKey: string;
  thumbnailStorageKey: null;
  imageWidth: number | null;
  imageHeight: number | null;
  originalBuffer: Buffer;
  uploadFileName: string;
};

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function buildEstimateStorageKey(
  workspaceId: string,
  estimateId: string,
  attachmentId: string,
  suffix: "original" | "thumb",
  fileName: string,
): string {
  return `${workspaceId}/${estimateId}/${attachmentId}/${suffix}-${sanitizeFileName(fileName)}`;
}

export function buildRequestStorageKey(
  workspaceId: string,
  requestId: string,
  fileId: string,
  suffix: "original" | "thumb",
  fileName: string,
): string {
  return `${workspaceId}/requests/${requestId}/${fileId}/${suffix}-${sanitizeFileName(fileName)}`;
}

export function buildIssueStorageKey(
  issueId: string,
  attachmentId: string,
  fileName: string,
): string {
  return `internal/issues/${issueId}/${attachmentId}/original-${sanitizeFileName(fileName)}`;
}

async function prepareFileBuffers(file: File): Promise<Omit<PreparedUploadFile, "storageKey">> {
  assertSingleFileSize(file.size);

  if (!isAllowedAttachmentMimeType(file.type)) {
    throw new StorageQuotaError("Unsupported file type.", "FILE_TOO_LARGE");
  }

  const attachmentType = resolveAttachmentType(file.type);
  const buffer = Buffer.from(await file.arrayBuffer());
  const attachmentId = randomUUID();

  if (attachmentType === AttachmentType.IMAGE) {
    const processed = await processImageOriginal(buffer, file.type);

    return {
      id: attachmentId,
      originalFileName: file.name,
      mimeType: processed.mimeType,
      attachmentType,
      storedBytes: processed.storedBytes,
      thumbnailStorageKey: null,
      imageWidth: processed.width,
      imageHeight: processed.height,
      originalBuffer: processed.originalBuffer,
      uploadFileName: file.name,
    };
  }

  const processed =
    attachmentType === AttachmentType.PDF ? processPdfBuffer(buffer) : processDocxBuffer(buffer);

  return {
    id: attachmentId,
    originalFileName: file.name,
    mimeType: file.type,
    attachmentType,
    storedBytes: processed.storedBytes,
    thumbnailStorageKey: null,
    imageWidth: null,
    imageHeight: null,
    originalBuffer: processed.originalBuffer,
    uploadFileName: file.name,
  };
}

export async function prepareUploadFiles(files: File[]): Promise<PreparedUploadFile[]> {
  assertBatchFileCount(files.length);

  const prepared: PreparedUploadFile[] = [];

  for (const file of files) {
    const item = await prepareFileBuffers(file);
    prepared.push({ ...item, storageKey: "" });
  }

  return prepared;
}

export function assignEstimateStorageKeys(
  prepared: PreparedUploadFile[],
  workspaceId: string,
  estimateId: string,
): PreparedUploadFile[] {
  return prepared.map((item) => ({
    ...item,
    storageKey: buildEstimateStorageKey(
      workspaceId,
      estimateId,
      item.id,
      "original",
      item.originalFileName,
    ),
    thumbnailStorageKey: null,
  }));
}

function assignRequestStorageKeys(
  prepared: Omit<PreparedUploadFile, "storageKey">[],
  workspaceId: string,
  requestId: string,
): PreparedUploadFile[] {
  return prepared.map((item) => ({
    ...item,
    storageKey: buildRequestStorageKey(
      workspaceId,
      requestId,
      item.id,
      "original",
      item.originalFileName,
    ),
    thumbnailStorageKey: null,
  }));
}

export async function uploadBlobToStorage(
  item: PreparedUploadFile,
  fileIndex?: number,
): Promise<{
  storageKey: string;
  thumbnailStorageKey: null;
}> {
  const storage = getStorageProvider();

  const originalUpload = await storage.upload({
    key: item.storageKey,
    customId: item.id,
    body: item.originalBuffer,
    mimeType: item.mimeType,
    fileName: item.uploadFileName,
    fileIndex,
  });

  return {
    storageKey: originalUpload.key,
    thumbnailStorageKey: null,
  };
}

export function collectStorageKeysFromRecords(records: RequestAttachmentRecord[]): string[] {
  const keys: string[] = [];

  for (const record of records) {
    if (record.status !== "stored") {
      continue;
    }

    keys.push(record.storageKey);

    if (record.thumbnailStorageKey) {
      keys.push(record.thumbnailStorageKey);
    }
  }

  return keys;
}

export async function deleteStorageKeys(keys: string[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }

  await getStorageProvider().delete(keys).catch(() => undefined);
}

export async function uploadFilesForEstimateRequest(input: {
  workspaceId: string;
  requestId: string;
  files: File[];
}): Promise<RequestAttachmentRecord[]> {
  if (input.files.length === 0) {
    return [];
  }

  const workspace = await getWorkspaceStorageFields(input.workspaceId);

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  const preparedRaw: Omit<PreparedUploadFile, "storageKey">[] = [];

  for (const file of input.files) {
    preparedRaw.push(await prepareFileBuffers(file));
  }

  const prepared = assignRequestStorageKeys(preparedRaw, input.workspaceId, input.requestId);
  const batchStoredBytes = prepared.reduce((sum, item) => sum + item.storedBytes, 0);
  assertWorkspaceHasStorageCapacity(workspace, batchStoredBytes);

  setUploadDiagnosticBatchContext({
    requestId: input.requestId,
    workspaceId: input.workspaceId,
    totalFiles: prepared.length,
  });

  logUploadThingDiagnostic("request upload batch start", {
    requestId: input.requestId,
    workspaceId: input.workspaceId,
    totalFiles: prepared.length,
    logFile: getUploadDiagnosticLogPath(),
  });

  const records: RequestAttachmentRecord[] = [];

  try {
    for (let index = 0; index < prepared.length; index += 1) {
      const item = prepared[index];
      const fileNumber = index + 1;
      const customId = item.id;
      const logicalKey = item.storageKey;
      const uploadStarted = new Date().toISOString();

      logUploadThingDiagnostic("request file start", {
        fileNumber,
        customId,
        customIdLength: customId.length,
        logicalKey,
        logicalKeyLength: logicalKey.length,
        fileName: item.originalFileName,
        fileId: item.id,
        byteLength: item.storedBytes,
        uploadStarted,
      });

      try {
        const uploaded = await uploadBlobToStorage(item, fileNumber);

        await incrementWorkspaceStorageUsed(input.workspaceId, item.storedBytes);

        logUploadThingDiagnostic("request file success", {
          fileNumber,
          customId,
          customIdLength: customId.length,
          logicalKey,
          logicalKeyLength: logicalKey.length,
          uploadSucceeded: new Date().toISOString(),
          uploadedStorageKey: uploaded.storageKey,
        });

        records.push({
          id: item.id,
          originalFileName: item.originalFileName,
          mimeType: item.mimeType,
          attachmentType: item.attachmentType,
          fileSizeBytes: item.storedBytes,
          storageKey: uploaded.storageKey,
          thumbnailStorageKey: null,
          imageWidth: item.imageWidth,
          imageHeight: item.imageHeight,
          status: "stored",
        });
      } catch (error) {
        logUploadThingDiagnostic(
          "request file failure",
          {
            fileNumber,
            customId,
            customIdLength: customId.length,
            logicalKey,
            logicalKeyLength: logicalKey.length,
            fileName: item.originalFileName,
            uploadFailed: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error),
          },
          { echoToConsole: true },
        );

        records.push({
          id: item.id,
          originalFileName: item.originalFileName,
          mimeType: item.mimeType,
          attachmentType: item.attachmentType,
          fileSizeBytes: item.storedBytes,
          storageKey: item.storageKey,
          thumbnailStorageKey: null,
          imageWidth: item.imageWidth,
          imageHeight: item.imageHeight,
          status: "failed",
          error: error instanceof Error ? error.message : "Upload failed.",
        });
      }
    }
  } finally {
    const storedCount = records.filter((record) => record.status === "stored").length;
    const failedCount = records.filter((record) => record.status === "failed").length;

    logUploadThingDiagnostic("request upload batch complete", {
      requestId: input.requestId,
      workspaceId: input.workspaceId,
      totalFiles: prepared.length,
      storedCount,
      failedCount,
      logFile: getUploadDiagnosticLogPath(),
    });

    setUploadDiagnosticBatchContext(null);
  }

  return records;
}

export async function uploadPreparedAttachments(input: {
  workspaceId: string;
  estimateId: string;
  uploadedById: string;
  files: File[];
  uploadSource?: AttachmentUploadSource;
}) {
  const workspace = await getWorkspaceStorageFields(input.workspaceId);

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  const prepared = assignEstimateStorageKeys(
    await prepareUploadFiles(input.files),
    input.workspaceId,
    input.estimateId,
  );

  const batchStoredBytes = prepared.reduce((sum, item) => sum + item.storedBytes, 0);
  assertWorkspaceHasStorageCapacity(workspace, batchStoredBytes);

  const uploadedKeys: string[] = [];

  try {
    const rows = [];

    for (const item of prepared) {
      const uploaded = await uploadBlobToStorage(item);
      uploadedKeys.push(uploaded.storageKey);

      rows.push({
        id: item.id,
        estimateId: input.estimateId,
        workspaceId: input.workspaceId,
        uploadedById: input.uploadedById,
        uploadSource: input.uploadSource ?? AttachmentUploadSource.EDITOR,
        attachmentType: item.attachmentType,
        originalFileName: item.originalFileName,
        mimeType: item.mimeType,
        fileSizeBytes: item.storedBytes,
        storageKey: uploaded.storageKey,
        thumbnailStorageKey: null,
        thumbnailStatus:
          item.attachmentType === AttachmentType.IMAGE
            ? AttachmentThumbnailStatus.PENDING
            : AttachmentThumbnailStatus.NOT_APPLICABLE,
        imageWidth: item.imageWidth,
        imageHeight: item.imageHeight,
      });
    }

    const created = await createAttachmentRecords(rows, batchStoredBytes);
    await syncEstimateAttachmentCount(input.estimateId);

    const imageAttachmentIds = created
      .filter((row) => row.attachmentType === AttachmentType.IMAGE)
      .map((row) => row.id);

    await enqueueAttachmentThumbnailGeneration({
      workspaceId: input.workspaceId,
      attachmentIds: imageAttachmentIds,
    });

    for (const row of created) {
      scheduleUpsertSearchDocumentForAttachment(row.id);
    }

    return created;
  } catch (error) {
    if (uploadedKeys.length > 0) {
      await deleteStorageKeys(uploadedKeys);
    }

    throw error;
  }
}

export async function precheckRequestUploadQuota(
  workspaceId: string,
  files: File[],
): Promise<number> {
  if (files.length === 0) {
    return 0;
  }

  const workspace = await getWorkspaceStorageFields(workspaceId);

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  let totalStoredBytes = 0;

  for (const file of files) {
    const item = await prepareFileBuffers(file);
    totalStoredBytes += item.storedBytes;
  }

  assertWorkspaceHasStorageCapacity(workspace, totalStoredBytes);

  return totalStoredBytes;
}

const MAX_ISSUE_SCREENSHOTS = 10;

function resolveIssueImageMimeType(
  file: File,
): (typeof ALLOWED_IMAGE_MIME_TYPES)[number] | null {
  if ((ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  return null;
}

async function prepareIssueImageFiles(files: File[]): Promise<PreparedUploadFile[]> {
  if (files.length > MAX_ISSUE_SCREENSHOTS) {
    throw new StorageQuotaError(
      `Cannot upload more than ${MAX_ISSUE_SCREENSHOTS} screenshots.`,
      "FILE_TOO_LARGE",
    );
  }

  const prepared: PreparedUploadFile[] = [];

  for (const file of files) {
    assertSingleFileSize(file.size);

    const mimeType = resolveIssueImageMimeType(file);

    if (!mimeType) {
      throw new StorageQuotaError("Only JPEG, PNG, and WebP images are allowed.", "FILE_TOO_LARGE");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const attachmentId = randomUUID();
    const processed = await processImageOriginal(buffer, mimeType);

    prepared.push({
      id: attachmentId,
      originalFileName: file.name,
      mimeType: processed.mimeType,
      attachmentType: AttachmentType.IMAGE,
      storedBytes: processed.storedBytes,
      storageKey: "",
      thumbnailStorageKey: null,
      imageWidth: processed.width,
      imageHeight: processed.height,
      originalBuffer: processed.originalBuffer,
      uploadFileName: file.name,
    });
  }

  return prepared;
}

function assignIssueStorageKeys(
  prepared: PreparedUploadFile[],
  issueId: string,
): PreparedUploadFile[] {
  return prepared.map((item) => ({
    ...item,
    storageKey: buildIssueStorageKey(issueId, item.id, item.originalFileName),
    thumbnailStorageKey: null,
  }));
}

export async function uploadPreparedIssueAttachments(input: {
  issueId: string;
  files: File[];
  uploadedById: string;
}) {
  const issue = await prisma.issue.findUnique({
    where: { id: input.issueId },
    select: {
      id: true,
      reportedById: true,
      _count: { select: { attachments: true } },
    },
  });

  if (!issue) {
    throw new Error("Issue not found.");
  }

  if (issue.reportedById !== input.uploadedById) {
    throw new PermissionError("Forbidden.");
  }

  if (issue._count.attachments + input.files.length > MAX_ISSUE_SCREENSHOTS) {
    throw new StorageQuotaError(
      `Issue cannot have more than ${MAX_ISSUE_SCREENSHOTS} screenshots.`,
      "FILE_TOO_LARGE",
    );
  }

  const prepared = assignIssueStorageKeys(
    await prepareIssueImageFiles(input.files),
    input.issueId,
  );

  const uploadedKeys: string[] = [];
  const baseSortOrder = issue._count.attachments;

  try {
    const created = [];

    for (let index = 0; index < prepared.length; index += 1) {
      const item = prepared[index];
      const uploaded = await uploadBlobToStorage(item, index);
      uploadedKeys.push(uploaded.storageKey);

      const row = await prisma.issueAttachment.create({
        data: {
          id: item.id,
          issueId: input.issueId,
          storageKey: uploaded.storageKey,
          originalFileName: item.originalFileName,
          mimeType: item.mimeType,
          fileSizeBytes: item.storedBytes,
          sortOrder: baseSortOrder + index,
        },
      });

      created.push(row);
    }

    return created;
  } catch (error) {
    if (uploadedKeys.length > 0) {
      await deleteStorageKeys(uploadedKeys);
    }

    throw error;
  }
}
