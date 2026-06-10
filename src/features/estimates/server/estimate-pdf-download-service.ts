import "server-only";

import { EstimatePdfStatus, type User } from "@prisma/client";

import { getStorageProvider } from "@/features/attachments/server/storage";
import {
  buildEstimatePdfDisplayFileName,
  buildEstimatePdfViewerTitle,
} from "@/features/estimates/lib/estimate-pdf-filename";
import { findEstimatePdfById } from "@/features/estimates/server/estimate-pdf-repository";
import type { Locale } from "@/lib/locale";
import { requireRole } from "@/server/permissions/require-workspace";

export async function getEstimatePdfDownloadUrl(input: {
  estimatePdfId: string;
  workspaceId: string;
  user: User;
  locale: Locale;
}): Promise<{ url: string; fileName: string; viewerTitle: string }> {
  await requireRole(input.user, input.workspaceId, "VIEWER");

  const record = await findEstimatePdfById(input.estimatePdfId);

  if (
    !record ||
    record.version.workspaceId !== input.workspaceId ||
    record.status !== EstimatePdfStatus.READY ||
    !record.fileKey
  ) {
    throw new Error("PDF not found.");
  }

  const storage = getStorageProvider();
  const url = await storage.getSignedUrl(record.fileKey);

  const nameInput = {
    requestNumber: record.estimate.estimateRequest?.requestNumber,
    estimateId: record.version.estimateId,
    versionNumber: record.version.versionNumber,
    locale: input.locale,
  };

  return {
    url,
    fileName: buildEstimatePdfDisplayFileName(nameInput),
    viewerTitle: buildEstimatePdfViewerTitle({ ...nameInput, locale: input.locale }),
  };
}
