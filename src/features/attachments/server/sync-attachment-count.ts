import "server-only";

import { prisma } from "@/db/client";

type TxClient = Pick<typeof prisma, "estimateAttachment" | "estimate">;

export async function syncEstimateAttachmentCount(
  estimateId: string,
  tx: TxClient = prisma,
): Promise<number> {
  const count = await tx.estimateAttachment.count({
    where: { estimateId },
  });

  await tx.estimate.update({
    where: { id: estimateId },
    data: { attachmentCount: count },
  });

  return count;
}
