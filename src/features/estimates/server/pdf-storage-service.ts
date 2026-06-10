import "server-only";

import { EstimatePdfStatus, type EstimatePdf } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

import { getStorageProvider } from "@/features/attachments/server/storage";

export function buildEstimatePdfStorageKey(
  workspaceId: string,
  estimatePdfId: string,
): string {
  return `${workspaceId}/pdfs/${estimatePdfId}/original.pdf`;
}

/** Pre-fix records stored the logical path instead of UploadThing's returned key. */
export function isLegacyLogicalPdfKey(
  fileKey: string | null | undefined,
  workspaceId: string,
  estimatePdfId: string,
): boolean {
  if (!fileKey) {
    return false;
  }

  return fileKey === buildEstimatePdfStorageKey(workspaceId, estimatePdfId);
}

export function needsEstimatePdfStorageHeal(
  record: Pick<EstimatePdf, "status" | "fileKey" | "storageCustomId">,
  workspaceId: string,
  estimatePdfId: string,
): boolean {
  if (record.status !== EstimatePdfStatus.READY) {
    return true;
  }

  if (!record.fileKey || !record.storageCustomId) {
    return true;
  }

  return isLegacyLogicalPdfKey(record.fileKey, workspaceId, estimatePdfId);
}

export async function uploadEstimatePdfBuffer(input: {
  workspaceId: string;
  estimatePdfId: string;
  buffer: Buffer;
  displayFileName: string;
}): Promise<{ fileKey: string; storageCustomId: string }> {
  const logicalKey = buildEstimatePdfStorageKey(input.workspaceId, input.estimatePdfId);
  const uploadCustomId = createId();
  const storage = getStorageProvider();

  const uploadResult = await storage.upload({
    key: logicalKey,
    customId: uploadCustomId,
    body: input.buffer,
    mimeType: "application/pdf",
    fileName: input.displayFileName,
  });

  return {
    fileKey: uploadResult.key,
    storageCustomId: uploadResult.customId ?? uploadCustomId,
  };
}

export async function deleteEstimatePdfFromStorage(fileKey: string): Promise<void> {
  if (!fileKey.trim()) {
    return;
  }

  const storage = getStorageProvider();
  await storage.delete([fileKey], { keyType: "fileKey" });
}

export async function deleteEstimatePdfByCustomId(customId: string): Promise<void> {
  if (!customId.trim()) {
    return;
  }

  const storage = getStorageProvider();
  await storage.delete([customId], { keyType: "customId" });
}

export async function cleanupEstimatePdfStorageFiles(input: {
  existing: Pick<EstimatePdf, "id" | "fileKey" | "storageCustomId">;
  workspaceId: string;
}): Promise<void> {
  const { existing, workspaceId } = input;

  if (
    existing.fileKey &&
    !isLegacyLogicalPdfKey(existing.fileKey, workspaceId, existing.id)
  ) {
    await deleteEstimatePdfFromStorage(existing.fileKey);
  }

  if (existing.storageCustomId) {
    await deleteEstimatePdfByCustomId(existing.storageCustomId);
  }

  // Pre-fix uploads used EstimatePdf.id as UploadThing customId.
  await deleteEstimatePdfByCustomId(existing.id);
}

export function createEstimatePdfId(): string {
  return createId();
}
