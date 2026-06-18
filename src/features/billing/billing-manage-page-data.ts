import type { WorkspaceBillingAddonsPageData } from "@/features/billing/billing-addons-page-data";
import type { WorkspaceBillingPlansPageData } from "@/features/billing/billing-plans-page-data";

export type WorkspaceBillingManagePageData = WorkspaceBillingPlansPageData &
  Pick<WorkspaceBillingAddonsPageData, "entitlements">;
