"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { getIssuesBasePath } from "@/features/issues/lib/issues-base-path";
import { ISSUE_ACTIVITY_ACTIONS } from "@/features/issues/lib/issue-activity-types";
import { serializeIssueComment } from "@/features/issues/lib/serialize-issue-comments";
import type { IssueCommentClient } from "@/features/issues/lib/serialize-issue-comments";
import {
  createIssueCommentSchema,
  deleteIssueCommentSchema,
  updateIssueCommentSchema,
} from "@/features/issues/schemas/issue-comment";
import { createIssueActivityLog } from "@/features/issues/server/activity-repository";
import {
  assertIssueExistsByNumber,
  createIssueComment,
  deleteIssueComment,
  updateIssueComment,
} from "@/features/issues/server/comments-repository";
import { assertIssueTrackerEnabled } from "@/lib/issue-tracker/guard";
import type { Locale } from "@/lib/locale";
import { assertIssueViewerAccess } from "@/server/auth/require-issue-viewer";
import { PermissionError } from "@/server/permissions/errors";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function revalidateIssuePaths(locale: Locale, number: number) {
  for (const variant of ["admin", "qa"] as const) {
    const base = getIssuesBasePath(locale, variant);
    revalidatePath(base);
    revalidatePath(`${base}/${number}`);
  }
}

function toActionError(error: unknown, fallback: string): ActionResult<never> {
  if (error instanceof PermissionError) {
    return { success: false, error: error.message };
  }

  console.error("[issue comments action]", error);
  return {
    success: false,
    error: error instanceof Error ? error.message : fallback,
  };
}

export async function createIssueCommentAction(
  input: {
    number: number;
    body: string;
    parentId?: string;
  },
  locale: Locale = "pl",
): Promise<ActionResult<{ comment: IssueCommentClient }>> {
  try {
    assertIssueTrackerEnabled();
    const user = await assertIssueViewerAccess(locale);
    const parsed = createIssueCommentSchema.parse(input);
    const issue = await assertIssueExistsByNumber(parsed.number);
    const row = await createIssueComment({
      issueId: issue.id,
      actorType: "USER",
      authorUserId: user.id,
      body: parsed.body,
      parentId: parsed.parentId,
    });

    await createIssueActivityLog({
      issueId: issue.id,
      actorType: "USER",
      actorUserId: user.id,
      action: ISSUE_ACTIVITY_ACTIONS.comment_added,
      metadata: {
        commentId: row.id,
        commentBody: row.body,
      },
    });

    revalidateIssuePaths(locale, parsed.number);
    return { success: true, data: { comment: serializeIssueComment(row) } };
  } catch (error) {
    return toActionError(error, "Failed to create issue comment.");
  }
}

export async function deleteIssueCommentAction(
  input: {
    number: number;
    commentId: string;
  },
  locale: Locale = "pl",
): Promise<ActionResult<{ ok: true }>> {
  try {
    assertIssueTrackerEnabled();
    const user = await assertIssueViewerAccess(locale);
    const parsed = deleteIssueCommentSchema.parse(input);
    const issue = await assertIssueExistsByNumber(parsed.number);

    const deleted = await deleteIssueComment({
      commentId: parsed.commentId,
      issueId: issue.id,
      authorUserId: user.id,
    });

    await createIssueActivityLog({
      issueId: issue.id,
      actorType: "USER",
      actorUserId: user.id,
      action: ISSUE_ACTIVITY_ACTIONS.comment_deleted,
      metadata: {
        commentId: parsed.commentId,
        commentBody: deleted.body,
        replyCount: deleted.replyCount,
      },
    });

    revalidateIssuePaths(locale, parsed.number);
    return { success: true, data: { ok: true } };
  } catch (error) {
    return toActionError(error, "Failed to delete issue comment.");
  }
}

export async function updateIssueCommentAction(
  input: {
    number: number;
    commentId: string;
    body: string;
  },
  locale: Locale = "pl",
): Promise<ActionResult<{ comment: IssueCommentClient }>> {
  try {
    assertIssueTrackerEnabled();
    const user = await assertIssueViewerAccess(locale);
    const parsed = updateIssueCommentSchema.parse(input);
    const issue = await assertIssueExistsByNumber(parsed.number);
    const { row, oldBody } = await updateIssueComment({
      commentId: parsed.commentId,
      issueId: issue.id,
      authorUserId: user.id,
      body: parsed.body,
    });

    await createIssueActivityLog({
      issueId: issue.id,
      actorType: "USER",
      actorUserId: user.id,
      action: ISSUE_ACTIVITY_ACTIONS.comment_edited,
      metadata: {
        commentId: row.id,
        oldBody,
        newBody: row.body,
      },
    });

    revalidateIssuePaths(locale, parsed.number);
    return { success: true, data: { comment: serializeIssueComment(row) } };
  } catch (error) {
    return toActionError(error, "Failed to update issue comment.");
  }
}
