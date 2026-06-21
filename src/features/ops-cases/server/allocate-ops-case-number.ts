import "server-only";

import { prisma } from "@/db/client";

export async function allocateOpsCaseNumber(): Promise<number> {
  return prisma.$transaction(async (tx) => {
    await tx.opsCaseNumberCounter.upsert({
      where: { id: "default" },
      create: { id: "default", value: 0 },
      update: {},
    });

    const counter = await tx.opsCaseNumberCounter.update({
      where: { id: "default" },
      data: { value: { increment: 1 } },
    });

    return counter.value;
  });
}
