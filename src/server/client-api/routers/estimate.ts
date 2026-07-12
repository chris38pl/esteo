import { z } from "zod";

import { internalEstimateCreateSchema } from "@/features/estimate-requests/schemas/request";
import { listAttachmentsByEstimateId } from "@/features/attachments/server/attachments-repository";
import { enqueueEstimateSend } from "@/features/estimates/server/enqueue-estimate-send";
import { loadEstimatesForListPage } from "@/features/estimates/server/list-estimates-page-data";
import {
  getEstimateForEditor,
  getVersionWithTree,
} from "@/features/estimates/server/repository";
import {
  createInternalEstimate,
  updateEstimateTitle,
} from "@/features/estimates/server/service";
import {
  serializeEstimateForEditor,
  serializeVersionWithTree,
} from "@/features/estimates/lib/serialize-estimate";
import {
  estimateCardSchema,
  estimateDetailSchema,
} from "@/server/client-api/dto/v1/estimate/dto";
import {
  toEstimateCard,
  toEstimateDetail,
} from "@/server/client-api/dto/v1/estimate/mapper";
import { TRPCError } from "@trpc/server";
import { router } from "@/server/trpc/init";
import { protectedProcedure } from "@/server/trpc/procedures";
import { resolveWorkspaceOr404, workspaceSlugInput } from "@/server/client-api/routers/_shared";

export const estimateRouter = router({
  list: protectedProcedure
    .input(workspaceSlugInput)
    .output(estimateCardSchema.array())
    .query(async ({ ctx, input }) => {
      const workspace = await resolveWorkspaceOr404(input.workspaceSlug, ctx.user.id);
      const items = await loadEstimatesForListPage(workspace.id, ctx.locale);
      return items.map(toEstimateCard);
    }),

  detail: protectedProcedure
    .input(workspaceSlugInput.extend({ estimateId: z.string() }))
    .output(estimateDetailSchema)
    .query(async ({ ctx, input }) => {
      const workspace = await resolveWorkspaceOr404(input.workspaceSlug, ctx.user.id);

      const raw = await getEstimateForEditor(input.estimateId, workspace.id);
      if (!raw) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Estimate not found." });
      }

      const preview = serializeEstimateForEditor(raw, 0);
      const latestVersionId = preview.latestVersionId;

      let versionTree = null;
      if (latestVersionId) {
        const rawTree = await getVersionWithTree(latestVersionId, workspace.id);
        if (rawTree) {
          versionTree = serializeVersionWithTree(rawTree);
        }
      }

      const estimate = versionTree
        ? serializeEstimateForEditor(raw, versionTree.sections.length)
        : preview;

      const attachments = await listAttachmentsByEstimateId(
        input.estimateId,
        workspace.id,
      );

      return toEstimateDetail({
        estimate,
        versionTree,
        attachmentCount: attachments.length,
      });
    }),

  create: protectedProcedure
    .input(internalEstimateCreateSchema.and(workspaceSlugInput))
    .output(z.object({ estimateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { workspaceSlug, ...body } = input;
      const workspace = await resolveWorkspaceOr404(workspaceSlug, ctx.user.id);
      return createInternalEstimate({
        userId: ctx.user.id,
        workspaceId: workspace.id,
        locale: ctx.locale,
        ...body,
      });
    }),

  update: protectedProcedure
    .input(
      workspaceSlugInput.extend({
        estimateId: z.string(),
        title: z.string().max(200).nullable(),
      }),
    )
    .output(z.object({ title: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const workspace = await resolveWorkspaceOr404(input.workspaceSlug, ctx.user.id);
      return updateEstimateTitle(ctx.user, {
        estimateId: input.estimateId,
        workspaceId: workspace.id,
        title: input.title,
      });
    }),

  send: protectedProcedure
    .input(
      workspaceSlugInput.extend({
        estimateId: z.string(),
        versionId: z.string(),
        sentToEmail: z.string().email(),
        attachPdf: z.boolean().default(true),
        isResend: z.boolean().optional(),
        activityNote: z.string().optional(),
      }),
    )
    .output(z.object({ sendId: z.string(), runId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspace = await resolveWorkspaceOr404(input.workspaceSlug, ctx.user.id);
      return enqueueEstimateSend({
        estimateId: input.estimateId,
        versionId: input.versionId,
        workspaceId: workspace.id,
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        sentToEmail: input.sentToEmail,
        attachPdf: input.attachPdf,
        isResend: input.isResend ?? false,
        activityNote: input.activityNote,
      });
    }),
});
