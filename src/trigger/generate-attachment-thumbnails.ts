import { task, logger } from "@trigger.dev/sdk";

import { generateAttachmentThumbnailBatch } from "@/features/attachments/server/thumbnail-generation-service";

export interface GenerateAttachmentThumbnailsPayload {
  workspaceId: string;
  attachmentIds: string[];
}

export const generateAttachmentThumbnailsTask = task({
  id: "generate-attachment-thumbnails",
  maxDuration: 300,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: GenerateAttachmentThumbnailsPayload, { ctx }) => {
    logger.info("Thumbnail generation batch started", {
      workspaceId: payload.workspaceId,
      attachmentIds: payload.attachmentIds,
      attachmentCount: payload.attachmentIds.length,
      attempt: ctx.attempt.number,
    });

    await generateAttachmentThumbnailBatch({
      workspaceId: payload.workspaceId,
      attachmentIds: payload.attachmentIds,
      attempt: ctx.attempt.number,
    });
  },
});
