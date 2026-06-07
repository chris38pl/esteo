import "server-only";

import { tasks } from "@trigger.dev/sdk";

import type { generateAttachmentThumbnailsTask } from "@/trigger/generate-attachment-thumbnails";

export async function enqueueAttachmentThumbnailGeneration(input: {
  workspaceId: string;
  attachmentIds: string[];
}): Promise<void> {
  if (input.attachmentIds.length === 0) {
    return;
  }

  await tasks.trigger<typeof generateAttachmentThumbnailsTask>(
    "generate-attachment-thumbnails",
    {
      workspaceId: input.workspaceId,
      attachmentIds: input.attachmentIds,
    },
  );
}
