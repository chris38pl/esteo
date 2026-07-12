import { toAccountProfile, type AccountProfileInput } from "@/server/client-api/dto/v1/account/mapper";
import {
  toWorkspaceOverview,
  toWorkspaceRef,
  type WorkspaceOverviewInput,
  type WorkspaceRefInput,
} from "@/server/client-api/dto/v1/workspace/mapper";
import type { Bootstrap } from "@/server/client-api/dto/v1/bootstrap/dto";

export type BootstrapInput = {
  meta: { apiVersion: string; dtoVersion: string; serverVersion: string };
  user: AccountProfileInput;
  locale: string;
  workspaces: WorkspaceRefInput[];
  activeWorkspace: WorkspaceOverviewInput | null;
  permissions: {
    role: "OWNER" | "MEMBER" | "VIEWER" | null;
    canCreateEstimate: boolean;
    canInviteMembers: boolean;
  };
  subscription: { plan: "FREE" | "PRO" | "BUSINESS"; status: string } | null;
  entitlements: {
    plan: "FREE" | "PRO" | "BUSINESS";
    usage: { estimatesThisMonth: number; aiCallsThisMonth: number };
    seats: { used: number; limit: number | null };
    limits: { maxEstimatesPerMonth: number | null; maxStorageBytes: number | null };
  } | null;
  featureFlags: Record<string, boolean>;
};

/** Pure: assembles the startup context DTO from already-fetched pieces. */
export function toBootstrap(input: BootstrapInput): Bootstrap {
  return {
    meta: input.meta,
    user: toAccountProfile(input.user),
    locale: input.locale,
    workspaces: input.workspaces.map(toWorkspaceRef),
    activeWorkspace: input.activeWorkspace
      ? toWorkspaceOverview(input.activeWorkspace)
      : null,
    permissions: input.permissions,
    subscription: input.subscription,
    entitlements: input.entitlements
      ? {
          plan: input.entitlements.plan,
          usage: input.entitlements.usage,
          seats: input.entitlements.seats,
          limits: {
            maxEstimatesPerMonth: input.entitlements.limits.maxEstimatesPerMonth,
            maxStorageBytes: input.entitlements.limits.maxStorageBytes,
          },
        }
      : null,
    featureFlags: input.featureFlags,
  };
}
