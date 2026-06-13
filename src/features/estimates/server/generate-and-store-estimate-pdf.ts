import "server-only";

import { EstimatePdfStatus } from "@prisma/client";

import { prisma } from "@/db/client";
import { buildEstimatePdfDisplayFileName } from "@/features/estimates/lib/estimate-pdf-filename";
import {
  findEstimatePdfByVersionId,
  updateEstimatePdfStatus,
  upsertEstimatePdfExportPending,
  upsertEstimatePdfReady,
} from "@/features/estimates/server/estimate-pdf-repository";
import {
  isEstimatePdfFresh,
  renderEstimatePdfForVersion,
} from "@/features/estimates/server/pdf-export-service";
import {
  cleanupEstimatePdfStorageFiles,
  createEstimatePdfId,
  needsEstimatePdfStorageHeal,
  uploadEstimatePdfBuffer,
} from "@/features/estimates/server/pdf-storage-service";
import type { Locale } from "@/lib/locale";

export async function generateAndStoreEstimatePdf(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  locale: Locale;
  userId: string;
}): Promise<{ estimatePdfId: string; cached: boolean }> {
  const version = await prisma.estimateVersion.findFirst({
    where: {
      id: input.versionId,
      estimateId: input.estimateId,
      workspaceId: input.workspaceId,
    },
    select: {
      id: true,
      versionNumber: true,
      updatedAt: true,
      estimate: {
        select: {
          estimateRequest: {
            select: { requestNumber: true },
          },
        },
      },
    },
  });

  if (!version) {
    throw new Error("Version not found.");
  }

  const existing = await findEstimatePdfByVersionId(input.versionId);

  if (
    existing &&
    !needsEstimatePdfStorageHeal(existing, input.workspaceId, existing.id) &&
    isEstimatePdfFresh({
      generatedAt: existing.generatedAt,
      versionUpdatedAt: version.updatedAt,
      generatedLocale: existing.generatedLocale,
      requestLocale: input.locale,
      pdfTemplateRevision: existing.pdfTemplateRevision,
    })
  ) {
    return { estimatePdfId: existing.id, cached: true };
  }

  const estimatePdfId = existing?.id ?? createEstimatePdfId();

  if (!existing) {
    await upsertEstimatePdfExportPending({
      id: estimatePdfId,
      estimateId: input.estimateId,
      versionId: input.versionId,
      createdById: input.userId,
    });
  }

  await updateEstimatePdfStatus({
    versionId: input.versionId,
    status: EstimatePdfStatus.GENERATING,
    errorMessage: null,
  });

  const displayFileName = buildEstimatePdfDisplayFileName({
    requestNumber: version.estimate.estimateRequest?.requestNumber,
    estimateId: input.estimateId,
    versionNumber: version.versionNumber,
    locale: input.locale,
  });

  const buffer = await renderEstimatePdfForVersion(input);

  if (existing) {
    await cleanupEstimatePdfStorageFiles({
      existing,
      workspaceId: input.workspaceId,
    });
  }

  const { fileKey, storageCustomId } = await uploadEstimatePdfBuffer({
    workspaceId: input.workspaceId,
    estimatePdfId,
    buffer,
    displayFileName,
  });

  await upsertEstimatePdfReady({
    id: estimatePdfId,
    estimateId: input.estimateId,
    versionId: input.versionId,
    fileKey,
    storageCustomId,
    generatedLocale: input.locale,
    createdById: input.userId,
  });

  return { estimatePdfId, cached: false };
}

export function sanitizeEstimatePdfErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.slice(0, 500);
  }

  return "PDF generation failed.";
}
