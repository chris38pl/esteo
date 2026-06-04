/**
 * Recomputes and persists totalNet / totalGross for every EstimateVersion.
 *
 * Run after applying migration 20260604200000_estimate_version_totals
 * and regenerating the Prisma client:
 *
 *   npm run prisma:generate
 *   npm run prisma:backfill-version-totals
 *
 * Stop the Next.js dev server first if `prisma generate` fails with EPERM on Windows.
 */
import { PrismaClient } from "@prisma/client";

import { calculateEstimate } from "../src/features/estimates/lib/calculate-estimate";

const prisma = new PrismaClient();

async function syncVersionTotals(versionId: string, workspaceId: string) {
  const version = await prisma.estimateVersion.findFirst({
    where: { id: versionId, workspaceId },
    include: {
      sections: {
        where: { deletedAt: null },
        include: {
          lineItems: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  if (!version) return;

  const items = version.sections.flatMap((section) =>
    section.lineItems.map((lineItem) => ({
      quantity: Number(lineItem.quantity),
      unitPrice: Number(lineItem.unitPrice),
      vatRate: Number(lineItem.vatRate),
    })),
  );

  const { totalNet, totalGross } = calculateEstimate(items, 0);

  await prisma.$executeRaw`
    UPDATE "EstimateVersion"
    SET "totalNet" = ${totalNet}, "totalGross" = ${totalGross}
    WHERE "id" = ${versionId}
  `;
}

async function main() {
  const versions = await prisma.estimateVersion.findMany({
    select: { id: true, workspaceId: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Backfilling totals for ${versions.length} estimate version(s)…`);

  let done = 0;
  for (const version of versions) {
    await syncVersionTotals(version.id, version.workspaceId);
    done += 1;
    if (done % 25 === 0 || done === versions.length) {
      console.log(`  ${done}/${versions.length}`);
    }
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
