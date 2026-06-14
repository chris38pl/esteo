import type { EstimateAttachmentClient } from "@/features/attachments/lib/serialize-attachments";
import type {
  WorkspaceBillingMemberUsage,
  WorkspaceBillingStorageUsage,
} from "@/features/billing/billing-page-data";
import type { WorkspaceEntitlements } from "@/server/billing/entitlement-service";

export type WorkspaceUsagePageData = {
  entitlements: WorkspaceEntitlements;
  storage: WorkspaceBillingStorageUsage;
  memberUsage: WorkspaceBillingMemberUsage[];
  attachments: EstimateAttachmentClient[];
};
