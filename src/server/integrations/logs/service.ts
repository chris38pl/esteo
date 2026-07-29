import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";
import type { IntegrationLogReference } from "@/server/integrations/logs/reference";

export async function writeIntegrationRequestLog(input: {
  workspaceId: string;
  apiKeyId?: string | null;
  httpRequestId: string;
  correlationId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  errorCode?: string | null;
  errorSummary?: string | null;
  estimateRequestId?: string | null;
  estimateId?: string | null;
  reference?: IntegrationLogReference | null;
  idempotencyKey?: string | null;
}) {
  await prisma.integrationRequestLog.create({
    data: {
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId ?? null,
      httpRequestId: input.httpRequestId,
      correlationId: input.correlationId,
      method: input.method,
      path: input.path,
      statusCode: input.statusCode,
      durationMs: input.durationMs,
      errorCode: input.errorCode ?? null,
      errorSummary: input.errorSummary ?? null,
      estimateRequestId: input.estimateRequestId ?? null,
      estimateId: input.estimateId ?? null,
      reference:
        input.reference === undefined || input.reference === null
          ? undefined
          : (input.reference as Prisma.InputJsonValue),
      idempotencyKey: input.idempotencyKey ?? null,
    },
  });
}

export async function listIntegrationRequestLogs(input: {
  workspaceId: string;
  take?: number;
}) {
  const rows = await prisma.integrationRequestLog.findMany({
    where: { workspaceId: input.workspaceId },
    orderBy: { createdAt: "desc" },
    take: input.take ?? 50,
    select: {
      id: true,
      httpRequestId: true,
      correlationId: true,
      method: true,
      path: true,
      statusCode: true,
      durationMs: true,
      errorCode: true,
      errorSummary: true,
      estimateRequestId: true,
      estimateId: true,
      reference: true,
      idempotencyKey: true,
      apiKeyId: true,
      createdAt: true,
    },
  });

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
}
