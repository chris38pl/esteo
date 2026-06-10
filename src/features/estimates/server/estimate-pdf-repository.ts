import "server-only";

import { EstimatePdfStatus } from "@prisma/client";

import { prisma } from "@/db/client";

export async function findEstimatePdfByVersionId(versionId: string) {
  return prisma.estimatePdf.findUnique({
    where: { versionId },
  });
}

export async function findEstimatePdfById(estimatePdfId: string) {
  return prisma.estimatePdf.findUnique({
    where: { id: estimatePdfId },
    include: {
      version: {
        select: {
          versionNumber: true,
          estimateId: true,
          workspaceId: true,
        },
      },
      estimate: {
        select: {
          estimateRequest: {
            select: { requestNumber: true },
          },
        },
      },
    },
  });
}

export async function listEstimatePdfsByEstimateId(estimateId: string) {
  return prisma.estimatePdf.findMany({
    where: {
      estimateId,
      status: EstimatePdfStatus.READY,
    },
    include: {
      version: {
        select: { versionNumber: true },
      },
    },
    orderBy: { version: { versionNumber: "asc" } },
  });
}

export async function upsertEstimatePdfExportPending(input: {
  id: string;
  estimateId: string;
  versionId: string;
  createdById: string;
}) {
  return prisma.estimatePdf.upsert({
    where: { versionId: input.versionId },
    create: {
      id: input.id,
      estimateId: input.estimateId,
      versionId: input.versionId,
      status: EstimatePdfStatus.PENDING,
      createdById: input.createdById,
    },
    update: {
      status: EstimatePdfStatus.PENDING,
      errorMessage: null,
      createdById: input.createdById,
    },
  });
}

export async function updateEstimatePdfStatus(input: {
  versionId: string;
  status: EstimatePdfStatus;
  errorMessage?: string | null;
}) {
  return prisma.estimatePdf.update({
    where: { versionId: input.versionId },
    data: {
      status: input.status,
      errorMessage: input.errorMessage ?? null,
    },
  });
}

export async function upsertEstimatePdfReady(input: {
  id: string;
  estimateId: string;
  versionId: string;
  fileKey: string;
  storageCustomId: string;
  generatedLocale: string;
  createdById: string | null;
}) {
  return prisma.estimatePdf.upsert({
    where: { versionId: input.versionId },
    create: {
      id: input.id,
      estimateId: input.estimateId,
      versionId: input.versionId,
      fileKey: input.fileKey,
      storageCustomId: input.storageCustomId,
      generatedLocale: input.generatedLocale,
      status: EstimatePdfStatus.READY,
      errorMessage: null,
      createdById: input.createdById,
      generatedAt: new Date(),
    },
    update: {
      fileKey: input.fileKey,
      storageCustomId: input.storageCustomId,
      generatedLocale: input.generatedLocale,
      status: EstimatePdfStatus.READY,
      errorMessage: null,
      createdById: input.createdById,
      generatedAt: new Date(),
    },
  });
}

export async function markEstimatePdfFailed(input: {
  versionId: string;
  errorMessage: string;
}) {
  return prisma.estimatePdf.update({
    where: { versionId: input.versionId },
    data: {
      status: EstimatePdfStatus.FAILED,
      errorMessage: input.errorMessage,
    },
  });
}

export async function deleteEstimatePdfRecord(estimatePdfId: string) {
  return prisma.estimatePdf.delete({
    where: { id: estimatePdfId },
  });
}
