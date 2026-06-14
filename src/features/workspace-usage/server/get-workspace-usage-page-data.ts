import "server-only";

import { listAttachmentsByWorkspaceId } from "@/features/attachments/server/attachments-repository";
import { serializeEstimateAttachments } from "@/features/attachments/lib/serialize-attachments";
import { loadWorkspaceMemberUsage } from "@/features/billing/server/load-workspace-member-usage";
import { loadWorkspaceStorageUsage } from "@/features/billing/server/load-workspace-storage-usage";
import type { WorkspaceUsagePageData } from "@/features/workspace-usage/workspace-usage-page-data";
import { getWorkspaceEntitlements } from "@/server/billing/entitlement-service";

export type { WorkspaceUsagePageData };

export async function getWorkspaceUsagePageData(
  workspaceId: string,
): Promise<WorkspaceUsagePageData> {
  const [entitlements, memberUsage, { storage }, attachmentRows] = await Promise.all([
    getWorkspaceEntitlements(workspaceId),
    loadWorkspaceMemberUsage(workspaceId),
    loadWorkspaceStorageUsage(workspaceId),
    listAttachmentsByWorkspaceId(workspaceId),
  ]);

  return {
    entitlements,
    storage,
    memberUsage,
    attachments: serializeEstimateAttachments(attachmentRows),
  };
}
