import "server-only";

import { prisma } from "@/db/client";

export async function incrementPublicFormVisit(workspaceId: string): Promise<void> {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { publicFormVisitCount: { increment: 1 } },
  });
}
