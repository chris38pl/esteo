import type {
  WorkspaceOverview,
  WorkspaceRef,
} from "@/server/client-api/dto/v1/workspace/dto";

export type WorkspaceRefInput = {
  id: string;
  slug: string;
  name: string;
};

export type WorkspaceOverviewInput = {
  workspace: {
    id: string;
    slug: string;
    name: string;
    attachmentStorageUsedBytes: number | bigint;
  };
  role: "OWNER" | "MEMBER" | "VIEWER";
  entitlements: {
    plan: "FREE" | "PRO" | "BUSINESS";
    effectiveStatus: string;
    limits: { maxStorageBytes: number | null };
    usage: { estimatesThisMonth: number; aiCallsThisMonth: number };
    seats: { used: number; limit: number | null };
  };
};

/** Pure: workspace -> lightweight reference DTO. */
export function toWorkspaceRef(workspace: WorkspaceRefInput): WorkspaceRef {
  return {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
  };
}

/** Pure: workspace + role + entitlements -> WorkspaceOverview DTO. */
export function toWorkspaceOverview(input: WorkspaceOverviewInput): WorkspaceOverview {
  const { workspace, role, entitlements } = input;
  return {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    role,
    plan: entitlements.plan,
    status: entitlements.effectiveStatus,
    storage: {
      usedBytes: Number(workspace.attachmentStorageUsedBytes),
      limitBytes: entitlements.limits.maxStorageBytes,
    },
    usage: {
      estimatesThisMonth: entitlements.usage.estimatesThisMonth,
      aiCallsThisMonth: entitlements.usage.aiCallsThisMonth,
    },
    seats: {
      used: entitlements.seats.used,
      limit: entitlements.seats.limit,
    },
  };
}
