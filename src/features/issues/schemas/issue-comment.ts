import { z } from "zod";

import { prismaEntityIdSchema } from "@/lib/schemas/prisma-id";

export const ISSUE_COMMENT_BODY_MAX_LENGTH = 4000;

export const issueCommentBodySchema = z
  .string()
  .trim()
  .min(1, "Comment cannot be empty.")
  .max(ISSUE_COMMENT_BODY_MAX_LENGTH);

export const createIssueCommentSchema = z.object({
  number: z.number().int().positive(),
  body: issueCommentBodySchema,
  parentId: prismaEntityIdSchema.optional(),
});

export const updateIssueCommentSchema = z.object({
  number: z.number().int().positive(),
  commentId: prismaEntityIdSchema,
  body: issueCommentBodySchema,
});

export const deleteIssueCommentSchema = z.object({
  number: z.number().int().positive(),
  commentId: prismaEntityIdSchema,
});

export type CreateIssueCommentInput = z.infer<typeof createIssueCommentSchema>;
