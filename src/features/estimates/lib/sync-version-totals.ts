import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";
import { calculateEstimate } from "@/features/estimates/lib/calculate-estimate";

type TxClient = Prisma.TransactionClient;

export async function syncVersionTotals(
  versionId: string,
  workspaceId: string,
  tx?: TxClient,
): Promise<{ totalNet: number; totalGross: number }> {
  const client = tx ?? prisma;

  const version = await client.estimateVersion.findFirst({
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

  if (!version) {
    return { totalNet: 0, totalGross: 0 };
  }

  const items = version.sections.flatMap((section) =>
    section.lineItems.map((lineItem) => ({
      quantity: Number(lineItem.quantity),
      unitPrice: Number(lineItem.unitPrice),
      vatRate: Number(lineItem.vatRate),
    })),
  );

  const { totalNet, totalGross } = calculateEstimate(items, 0);

  await client.$executeRaw`
    UPDATE "EstimateVersion"
    SET "totalNet" = ${totalNet}, "totalGross" = ${totalGross}
    WHERE "id" = ${versionId}
  `;

  return { totalNet, totalGross };
}

export async function syncLatestVersionTotalsForWorkspace(
  workspaceId: string,
): Promise<void> {
  const estimates = await prisma.estimate.findMany({
    where: { workspaceId, deletedAt: null },
    select: { latestVersionId: true },
  });

  const versionIds = estimates
    .map((estimate) => estimate.latestVersionId)
    .filter((id): id is string => Boolean(id));

  await Promise.all(
    versionIds.map((versionId) => syncVersionTotals(versionId, workspaceId)),
  );
}

/** Recomputes totals for every estimate version (all workspaces). */
export async function syncAllVersionTotals(): Promise<{ updated: number }> {
  const versions = await prisma.estimateVersion.findMany({
    select: { id: true, workspaceId: true },
  });

  for (const version of versions) {
    await syncVersionTotals(version.id, version.workspaceId);
  }

  return { updated: versions.length };
}
