import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  getWorkspaceEstimateRequestDetail,
  listWorkspaceEstimateRequests,
} from "@/features/estimate-requests/server/workspace-requests";
import {
  requestCardSchema,
  requestDetailSchema,
} from "@/server/client-api/dto/v1/request/dto";
import {
  toRequestCard,
  toRequestDetail,
} from "@/server/client-api/dto/v1/request/mapper";
import { router } from "@/server/trpc/init";
import { protectedProcedure } from "@/server/trpc/procedures";
import { resolveWorkspaceOr404, workspaceSlugInput } from "@/server/client-api/routers/_shared";

export const requestRouter = router({
  list: protectedProcedure
    .input(workspaceSlugInput)
    .output(requestCardSchema.array())
    .query(async ({ ctx, input }) => {
      const workspace = await resolveWorkspaceOr404(input.workspaceSlug, ctx.user.id);
      const items = await listWorkspaceEstimateRequests(workspace.id, ctx.locale);
      return items.map(toRequestCard);
    }),

  detail: protectedProcedure
    .input(workspaceSlugInput.extend({ requestId: z.string() }))
    .output(requestDetailSchema)
    .query(async ({ ctx, input }) => {
      const workspace = await resolveWorkspaceOr404(input.workspaceSlug, ctx.user.id);
      const detail = await getWorkspaceEstimateRequestDetail({
        requestId: input.requestId,
        workspaceId: workspace.id,
        locale: ctx.locale,
      });
      if (!detail) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found." });
      }
      return toRequestDetail(detail);
    }),
});
