import { getAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import { getWorkspaceEntitlements } from "@/server/billing/entitlement-service";
import { requireWorkspace } from "@/server/permissions/require-workspace";
import {
  workspaceOverviewSchema,
  workspaceRefSchema,
} from "@/server/client-api/dto/v1/workspace/dto";
import {
  toWorkspaceOverview,
  toWorkspaceRef,
} from "@/server/client-api/dto/v1/workspace/mapper";
import { router } from "@/server/trpc/init";
import { protectedProcedure } from "@/server/trpc/procedures";
import { resolveWorkspaceOr404, workspaceSlugInput } from "@/server/client-api/routers/_shared";

export const workspaceRouter = router({
  list: protectedProcedure
    .output(workspaceRefSchema.array())
    .query(async ({ ctx }) => {
      const workspaces = await getAccessibleWorkspaces(ctx.user.id);
      return workspaces.map(toWorkspaceRef);
    }),

  overview: protectedProcedure
    .input(workspaceSlugInput)
    .output(workspaceOverviewSchema)
    .query(async ({ ctx, input }) => {
      const workspace = await resolveWorkspaceOr404(input.workspaceSlug, ctx.user.id);
      const membershipCtx = await requireWorkspace(ctx.user, workspace.id);
      const entitlements = await getWorkspaceEntitlements(workspace.id);
      return toWorkspaceOverview({
        workspace,
        role: membershipCtx.membership.role,
        entitlements,
      });
    }),
});
