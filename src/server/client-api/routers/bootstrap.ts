import { z } from "zod";

import { getAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import {
  deriveEstimateProcessingGate,
  getWorkspaceEntitlements,
} from "@/server/billing/entitlement-service";
import { requireWorkspace } from "@/server/permissions/require-workspace";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";
import { bootstrapSchema } from "@/server/client-api/dto/v1/bootstrap/dto";
import {
  toBootstrap,
  type BootstrapInput,
} from "@/server/client-api/dto/v1/bootstrap/mapper";
import type { WorkspaceOverviewInput } from "@/server/client-api/dto/v1/workspace/mapper";
import {
  API_VERSION,
  DTO_VERSION,
  SERVER_VERSION,
} from "@/server/client-api/version";
import { protectedProcedure } from "@/server/trpc/procedures";

export const bootstrapProcedure = protectedProcedure
  .input(z.object({ workspaceSlug: z.string().min(2).optional() }).optional())
  .output(bootstrapSchema)
  .query(async ({ ctx, input }) => {
    const accessible = await getAccessibleWorkspaces(ctx.user.id);
    const workspaces = accessible.map((workspace) => ({
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
    }));

    let activeWorkspace: WorkspaceOverviewInput | null = null;
    let permissions: BootstrapInput["permissions"] = {
      role: null,
      canCreateEstimate: false,
      canInviteMembers: false,
    };
    let subscription: BootstrapInput["subscription"] = null;
    let entitlements: BootstrapInput["entitlements"] = null;

    const slug = input?.workspaceSlug ?? accessible[0]?.slug ?? null;
    if (slug) {
      const resolved = await resolveWorkspaceBySlug(slug, ctx.user.id);
      if (resolved) {
        const membershipCtx = await requireWorkspace(ctx.user, resolved.workspace.id);
        const entitlementData = await getWorkspaceEntitlements(resolved.workspace.id);
        const role = membershipCtx.membership.role;
        const gate = deriveEstimateProcessingGate(entitlementData);

        activeWorkspace = {
          workspace: resolved.workspace,
          role,
          entitlements: entitlementData,
        };
        permissions = {
          role,
          canCreateEstimate: gate.allowed,
          canInviteMembers: role === "OWNER",
        };
        subscription = {
          plan: entitlementData.plan,
          status: entitlementData.effectiveStatus,
        };
        entitlements = {
          plan: entitlementData.plan,
          usage: entitlementData.usage,
          seats: entitlementData.seats,
          limits: {
            maxEstimatesPerMonth: entitlementData.limits.maxEstimatesPerMonth,
            maxStorageBytes: entitlementData.limits.maxStorageBytes,
          },
        };
      }
    }

    return toBootstrap({
      meta: {
        apiVersion: API_VERSION,
        dtoVersion: DTO_VERSION,
        serverVersion: SERVER_VERSION,
      },
      user: ctx.user,
      locale: ctx.locale,
      workspaces,
      activeWorkspace,
      permissions,
      subscription,
      entitlements,
      // Feature flags are backend-owned and read-only; none are exposed to
      // clients in v1 (reserved surface).
      featureFlags: {},
    });
  });
