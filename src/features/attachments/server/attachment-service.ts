import "server-only";

/**
 * Attachment Service facade for the Integration Platform.
 * Callers must not depend on the underlying storage provider.
 */

import { AttachmentUploadSource } from "@prisma/client";

import {
  deleteStagingAttachment,
  uploadStagingAttachment,
} from "@/features/attachments/server/staging-attachment-service";
import { deleteStorageKeys } from "@/features/attachments/server/upload-service";

export type StoredAttachmentRef = {
  attachmentId: string;
  storageKey: string | null;
};

export async function storeIntegrationAttachments(input: {
  workspaceId: string;
  apiKeyId: string;
  files: File[];
}): Promise<
  | { ok: true; refs: StoredAttachmentRef[] }
  | { ok: false; refs: StoredAttachmentRef[]; error: string }
> {
  const refs: StoredAttachmentRef[] = [];
  const owner = { publicFingerprint: `integration:${input.apiKeyId}` };

  for (const file of input.files) {
    const result = await uploadStagingAttachment({
      workspaceId: input.workspaceId,
      uploadSource: AttachmentUploadSource.PUBLIC_API,
      owner,
      file,
    });

    refs.push({ attachmentId: result.attachmentId, storageKey: null });

    if (result.status === "FAILED") {
      await cleanupIntegrationAttachments({
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        refs,
      });
      return {
        ok: false,
        refs,
        error: result.error ?? "Attachment upload failed.",
      };
    }
  }

  return { ok: true, refs };
}

export async function cleanupIntegrationAttachments(input: {
  workspaceId: string;
  apiKeyId: string;
  refs: StoredAttachmentRef[];
  extraStorageKeys?: string[];
}): Promise<void> {
  const owner = { publicFingerprint: `integration:${input.apiKeyId}` };

  for (const ref of input.refs) {
    await deleteStagingAttachment({
      workspaceId: input.workspaceId,
      attachmentId: ref.attachmentId,
      owner,
    }).catch(() => undefined);
  }

  if (input.extraStorageKeys && input.extraStorageKeys.length > 0) {
    await deleteStorageKeys(input.extraStorageKeys).catch(() => undefined);
  }
}
