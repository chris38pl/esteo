import "server-only";

import { prisma } from "@/db/client";

export async function allocateIssueNumber(): Promise<number> {
  return prisma.$transaction(async (tx) => {
    await tx.issueNumberCounter.upsert({
      where: { id: "default" },
      create: { id: "default", value: 0 },
      update: {},
    });

    const counter = await tx.issueNumberCounter.update({
      where: { id: "default" },
      data: { value: { increment: 1 } },
    });

    return counter.value;
  });
}
