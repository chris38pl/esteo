import { z } from "zod";

export const inboxItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  state: z.string(),
  priority: z.string(),
  href: z.string(),
  read: z.boolean(),
  primaryActionLabelKey: z.string().nullable(),
  primaryActionHref: z.string().nullable(),
  secondaryActionLabelKey: z.string().nullable(),
  secondaryActionHref: z.string().nullable(),
  payload: z.unknown(),
  readAt: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
  workspaceId: z.string().nullable(),
  workspaceName: z.string().nullable(),
});

export const inboxCountsSchema = z.object({
  total: z.number(),
  unread: z.number(),
  actionRequired: z.number(),
});

export const inboxListSchema = z.object({
  items: z.array(inboxItemSchema),
  counts: inboxCountsSchema,
  nextCursor: z.string().nullable(),
});

export const inboxMarkReadResultSchema = z.object({
  ok: z.boolean(),
  counts: inboxCountsSchema,
});

export type InboxItem = z.infer<typeof inboxItemSchema>;
export type InboxCounts = z.infer<typeof inboxCountsSchema>;
export type InboxList = z.infer<typeof inboxListSchema>;
export type InboxMarkReadResult = z.infer<typeof inboxMarkReadResultSchema>;
