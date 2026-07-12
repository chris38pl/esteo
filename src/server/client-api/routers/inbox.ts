import { z } from "zod";

import {
  getNotificationCounts,
  getNotificationsList,
  markNotificationAsRead,
} from "@/features/notifications/server/get-notifications";
import {
  inboxListSchema,
  inboxMarkReadResultSchema,
} from "@/server/client-api/dto/v1/inbox/dto";
import {
  toInboxCounts,
  toInboxItem,
} from "@/server/client-api/dto/v1/inbox/mapper";
import { router } from "@/server/trpc/init";
import { protectedProcedure } from "@/server/trpc/procedures";

export const inboxRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          actionRequiredOnly: z.boolean().optional(),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .output(inboxListSchema)
    .query(async ({ ctx, input }) => {
      const { items, nextCursor } = await getNotificationsList({
        userId: ctx.user.id,
        actionRequiredOnly: input?.actionRequiredOnly,
        cursor: input?.cursor,
      });
      const counts = await getNotificationCounts(ctx.user.id);
      return {
        items: items.map(toInboxItem),
        counts: toInboxCounts(counts),
        nextCursor,
      };
    }),

  markRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .output(inboxMarkReadResultSchema)
    .mutation(async ({ ctx, input }) => {
      const ok = await markNotificationAsRead(ctx.user.id, input.notificationId);
      const counts = await getNotificationCounts(ctx.user.id);
      return { ok, counts: toInboxCounts(counts) };
    }),
});
