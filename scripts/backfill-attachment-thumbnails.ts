/**
 * Enqueues batched generate-attachment-thumbnails jobs for IMAGE rows missing thumbnails.
 *
 *   npm run prisma:generate
 *   npm run prisma:backfill-attachment-thumbnails
 */
import { AttachmentThumbnailStatus, AttachmentType, PrismaClient } from "@prisma/client";
import { tasks } from "@trigger.dev/sdk";

import type { generateAttachmentThumbnailsTask } from "../src/trigger/generate-attachment-thumbnails";

const BATCH_SIZE = 20;
const prisma = new PrismaClient();

async function main() {
  const pending = await prisma.estimateAttachment.findMany({
    where: {
      attachmentType: AttachmentType.IMAGE,
      thumbnailStatus: {
        in: [AttachmentThumbnailStatus.PENDING, AttachmentThumbnailStatus.FAILED],
      },
    },
    select: { id: true, workspaceId: true },
    orderBy: { createdAt: "asc" },
  });

  if (pending.length === 0) {
    console.log("No attachments need thumbnail backfill.");
    return;
  }

  const byWorkspace = new Map<string, string[]>();

  for (const row of pending) {
    const ids = byWorkspace.get(row.workspaceId) ?? [];
    ids.push(row.id);
    byWorkspace.set(row.workspaceId, ids);
  }

  let jobCount = 0;

  for (const [workspaceId, attachmentIds] of byWorkspace) {
    for (let index = 0; index < attachmentIds.length; index += BATCH_SIZE) {
      const batch = attachmentIds.slice(index, index + BATCH_SIZE);

      await tasks.trigger<typeof generateAttachmentThumbnailsTask>(
        "generate-attachment-thumbnails",
        { workspaceId, attachmentIds: batch },
      );

      jobCount += 1;
      console.log(`Triggered batch for workspace ${workspaceId}: ${batch.length} attachment(s).`);
    }
  }

  console.log(`Enqueued ${jobCount} thumbnail generation job(s) for ${pending.length} attachment(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
