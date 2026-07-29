import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export async function findIdempotencyRecord(input: {
  apiKeyId: string;
  key: string;
}) {
  const row = await prisma.integrationIdempotencyRecord.findUnique({
    where: {
      apiKeyId_key: {
        apiKeyId: input.apiKeyId,
        key: input.key,
      },
    },
  });

  if (!row) {
    return null;
  }

  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.integrationIdempotencyRecord.delete({ where: { id: row.id } }).catch(() => undefined);
    return null;
  }

  return row;
}

export async function saveIdempotencyRecord(input: {
  workspaceId: string;
  apiKeyId: string;
  key: string;
  requestHash: string;
  responseStatus: number;
  responseBody: Prisma.InputJsonValue;
}) {
  const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS);

  await prisma.integrationIdempotencyRecord.upsert({
    where: {
      apiKeyId_key: {
        apiKeyId: input.apiKeyId,
        key: input.key,
      },
    },
    create: {
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      key: input.key,
      requestHash: input.requestHash,
      responseStatus: input.responseStatus,
      responseBody: input.responseBody,
      expiresAt,
    },
    update: {
      requestHash: input.requestHash,
      responseStatus: input.responseStatus,
      responseBody: input.responseBody,
      expiresAt,
    },
  });
}
