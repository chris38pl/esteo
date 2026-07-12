import { resolveDashboardGreetingName } from "@/features/dashboard/lib/resolve-dashboard-greeting-name";
import { getDashboardKpiStats } from "@/features/dashboard/server/get-dashboard-kpi-stats";
import { dashboardSummarySchema } from "@/server/client-api/dto/v1/dashboard/dto";
import { toDashboardSummary } from "@/server/client-api/dto/v1/dashboard/mapper";
import { toWorkspaceRef } from "@/server/client-api/dto/v1/workspace/mapper";
import { router } from "@/server/trpc/init";
import { protectedProcedure } from "@/server/trpc/procedures";
import { resolveWorkspaceOr404, workspaceSlugInput } from "@/server/client-api/routers/_shared";

export const dashboardRouter = router({
  summary: protectedProcedure
    .input(workspaceSlugInput)
    .output(dashboardSummarySchema)
    .query(async ({ ctx, input }) => {
      const workspace = await resolveWorkspaceOr404(input.workspaceSlug, ctx.user.id);
      const stats = await getDashboardKpiStats(workspace.id);
      const greetingName = resolveDashboardGreetingName(ctx.user.name, ctx.user.email);
      return toDashboardSummary({
        greetingName,
        workspace: toWorkspaceRef(workspace),
        stats,
      });
    }),
});
