/**
 * Recomputes Estimate.attachmentCount from EstimateAttachment rows.
 *
 * Run after applying migration 20260607154746_estimate_attachments_phase_2:
 *
 *   npm run prisma:generate
 *   npm run prisma:backfill-attachment-count
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const estimates = await prisma.estimate.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  let updated = 0;

  for (const estimate of estimates) {
    const count = await prisma.estimateAttachment.count({
      where: { estimateId: estimate.id },
    });

    await prisma.estimate.update({
      where: { id: estimate.id },
      data: { attachmentCount: count },
    });

    updated += 1;
  }

  console.log(`Synced attachmentCount for ${updated} estimates.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
