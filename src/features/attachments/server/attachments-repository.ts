import "server-only";



import { AttachmentThumbnailStatus } from "@prisma/client";



import { prisma } from "@/db/client";

import { assertEstimateInWorkspace } from "@/features/estimates/server/notes-repository";



const attachmentInclude = {

  uploadedBy: {

    select: { id: true, name: true },

  },

} as const;



export async function listAttachmentsByWorkspaceId(workspaceId: string) {
  return prisma.estimateAttachment.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: attachmentInclude,
  });
}

export async function listAttachmentsByEstimateId(estimateId: string, workspaceId: string) {

  await assertEstimateInWorkspace(estimateId, workspaceId);



  return prisma.estimateAttachment.findMany({

    where: { estimateId, workspaceId },

    orderBy: { createdAt: "asc" },

    include: attachmentInclude,

  });

}



export async function getAttachmentById(attachmentId: string, workspaceId: string) {

  return prisma.estimateAttachment.findFirst({

    where: { id: attachmentId, workspaceId },

    include: attachmentInclude,

  });

}



export async function listAttachmentsForEstimateCleanup(estimateId: string) {

  return prisma.estimateAttachment.findMany({

    where: { estimateId },

    select: {

      id: true,

      workspaceId: true,

      fileSizeBytes: true,

      storageKey: true,

      thumbnailStorageKey: true,

      thumbnailStatus: true,

    },

  });

}



export async function deleteAttachmentRecord(attachmentId: string, workspaceId: string) {

  return prisma.estimateAttachment.delete({

    where: { id: attachmentId, workspaceId },

  });

}



export async function createAttachmentRecords(

  rows: Array<{

    id: string;

    estimateId: string;

    workspaceId: string;

    uploadedById: string | null;

    uploadSource?: "EDITOR" | "PUBLIC_REQUEST" | "INTERNAL_REQUEST" | "PUBLIC_API";

    attachmentType: "IMAGE" | "PDF" | "DOCX";

    originalFileName: string;

    mimeType: string;

    fileSizeBytes: number;

    storageKey: string;

    thumbnailStorageKey: string | null;

    thumbnailStatus?: AttachmentThumbnailStatus;

    imageWidth: number | null;

    imageHeight: number | null;

  }>,

  totalStoredBytes: number,

) {

  return prisma.$transaction(async (tx) => {

    const created = [];



    for (const row of rows) {

      const attachment = await tx.estimateAttachment.create({

        data: {

          id: row.id,

          estimateId: row.estimateId,

          workspaceId: row.workspaceId,

          uploadedById: row.uploadedById,

          uploadSource: row.uploadSource ?? "EDITOR",

          attachmentType: row.attachmentType,

          originalFileName: row.originalFileName,

          mimeType: row.mimeType,

          fileSizeBytes: BigInt(row.fileSizeBytes),

          storageKey: row.storageKey,

          thumbnailStorageKey: row.thumbnailStorageKey,

          thumbnailStatus: row.thumbnailStatus ?? AttachmentThumbnailStatus.NOT_APPLICABLE,

          imageWidth: row.imageWidth,

          imageHeight: row.imageHeight,

        },

        include: attachmentInclude,

      });



      created.push(attachment);

    }



    if (totalStoredBytes > 0 && rows[0]) {

      await tx.workspace.update({

        where: { id: rows[0].workspaceId },

        data: {

          attachmentStorageUsedBytes: {

            increment: BigInt(totalStoredBytes),

          },

        },

      });

    }



    return created;

  });

}

