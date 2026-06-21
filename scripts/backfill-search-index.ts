/**
 * Backfills SearchDocument rows for all active workspaces.
 *
 *   npm run prisma:generate
 *   npm run prisma:backfill-search-index
 *   npm run prisma:backfill-search-index:staging
 */
import { PrismaClient } from "@prisma/client";

import {
  upsertSearchDocumentForAttachment,
  upsertSearchDocumentForEstimate,
  upsertSearchDocumentForInquiry,
  upsertSearchDocumentsForRequestAttachments,
} from "../src/features/search/server/index-upsert";

const prisma = new PrismaClient();

async function main() {
  const workspaces = await prisma.workspace.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });

  let estimateCount = 0;
  let inquiryCount = 0;
  let attachmentCount = 0;

  for (const workspace of workspaces) {
    console.log(`Indexing workspace: ${workspace.name} (${workspace.id})`);

    const estimates = await prisma.estimate.findMany({
      where: { workspaceId: workspace.id, deletedAt: null },
      select: { id: true },
    });

    for (const estimate of estimates) {
      await upsertSearchDocumentForEstimate(estimate.id);
      estimateCount += 1;
    }

    const inquiries = await prisma.estimateRequest.findMany({
      where: { workspaceId: workspace.id, deletedAt: null },
      select: { id: true },
    });

    for (const inquiry of inquiries) {
      await upsertSearchDocumentForInquiry(inquiry.id);
      inquiryCount += 1;
      await upsertSearchDocumentsForRequestAttachments(inquiry.id);
    }

    const attachments = await prisma.estimateAttachment.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true },
    });

    for (const attachment of attachments) {
      await upsertSearchDocumentForAttachment(attachment.id);
      attachmentCount += 1;
    }
  }

  console.log(
    `Backfill complete: ${estimateCount} estimates, ${inquiryCount} inquiries, ${attachmentCount} attachments.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
