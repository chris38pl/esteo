import "server-only";

import { prisma } from "@/db/client";
import { getWorkspaceStorageSummary } from "@/features/attachments/server/assert-workspace-storage";
import type { WorkspaceBillingStorageUsage } from "@/features/billing/billing-page-data";

export async function loadWorkspaceStorageUsage(workspaceId: string): Promise<{
  storage: WorkspaceBillingStorageUsage;
  storageOverLimit: boolean;
}> {
  const storageRow = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      attachmentStorageUsedBytes: true,
      attachmentStorageLimitBytes: true,
    },
  });

  const storageSummary =
    storageRow != null ? getWorkspaceStorageSummary(storageRow) : null;

  return {
    storage: {
      usedFormatted: storageSummary?.usedFormatted ?? "0 B",
      limitFormatted: storageSummary?.limitFormatted ?? "0 B",
      usedPercent: storageSummary?.usedPercent ?? 0,
    },
    storageOverLimit: storageSummary?.level === "exhausted",
  };
}
