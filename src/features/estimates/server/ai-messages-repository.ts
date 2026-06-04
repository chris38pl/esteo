import type { EstimateAiMessageRole, Prisma } from "@prisma/client";

import { prisma } from "@/db/client";

export type AiMessageRow = {
  id: string;
  versionId: string;
  role: EstimateAiMessageRole;
  content: string;
  proposalJson: Prisma.JsonValue | null;
  createdAt: Date;
};

export async function listAiMessagesByVersionId(
  versionId: string,
): Promise<AiMessageRow[]> {
  return prisma.estimateAiMessage.findMany({
    where: { versionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      versionId: true,
      role: true,
      content: true,
      proposalJson: true,
      createdAt: true,
    },
  });
}

export async function appendAiMessage(
  tx: Prisma.TransactionClient,
  input: {
    versionId: string;
    role: EstimateAiMessageRole;
    content: string;
    proposalJson?: Prisma.InputJsonValue;
  },
): Promise<AiMessageRow> {
  return tx.estimateAiMessage.create({
    data: {
      versionId: input.versionId,
      role: input.role,
      content: input.content,
      proposalJson: input.proposalJson ?? undefined,
    },
    select: {
      id: true,
      versionId: true,
      role: true,
      content: true,
      proposalJson: true,
      createdAt: true,
    },
  });
}

export async function getLatestAiApprovedRevisionAt(
  versionId: string,
): Promise<Date | null> {
  const revision = await prisma.estimateRevision.findFirst({
    where: { versionId, source: "AI_APPROVED" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return revision?.createdAt ?? null;
}
