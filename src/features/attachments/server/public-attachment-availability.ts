import { prisma } from "@/db/client";
import {
  createAvailableAttachmentAvailability,
  createStorageLimitAttachmentAvailability,
  type PublicAttachmentAvailability,
} from "@/features/attachments/lib/attachment-availability";
import { canAcceptAttachments } from "@/features/attachments/server/assert-workspace-storage";

export async function getPublicAttachmentAvailability(
  workspaceId: string,
): Promise<PublicAttachmentAvailability> {
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    select: {
      attachmentStorageUsedBytes: true,
      attachmentStorageLimitBytes: true,
    },
  });

  if (!workspace || !canAcceptAttachments(workspace)) {
    return createStorageLimitAttachmentAvailability();
  }

  return createAvailableAttachmentAvailability();
}

export async function getWorkspaceStorageFields(workspaceId: string) {
  return prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    select: {
      id: true,
      attachmentStorageUsedBytes: true,
      attachmentStorageLimitBytes: true,
    },
  });
}
