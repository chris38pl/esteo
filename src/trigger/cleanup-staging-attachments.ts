import "server-only";

import { schedules } from "@trigger.dev/sdk";

import { cleanupOrphanStagingAttachments } from "@/features/attachments/server/staging-attachment-cleanup";

export const cleanupStagingAttachmentsTask = schedules.task({
  id: "cleanup-staging-attachments",
  cron: "0 * * * *",
  run: async () => {
    const result = await cleanupOrphanStagingAttachments();
    return result;
  },
});
