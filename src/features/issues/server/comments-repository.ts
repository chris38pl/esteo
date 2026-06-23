import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";
import type { IssueActivityActorType } from "@/features/issues/lib/issue-activity-types";
import { PermissionError } from "@/server/permissions/errors";

const authorSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  avatarPreset: true,
} as const;

const issueCommentSelect = {
  id: true,
  issueId: true,
  parentId: true,
  actorType: true,
  authorUserId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  author: { select: authorSelect },
} satisfies Prisma.IssueCommentSelect;

export type IssueCommentRow = {
  id: string;
  issueId: string;
  parentId: string | null;
  actorType: IssueActivityActorType;
  authorUserId: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    avatarPreset: string | null;
  } | null;
};

type IssueCommentClient = Prisma.TransactionClient | typeof prisma;

export async function assertIssueExistsByNumber(
  number: number,
  tx: IssueCommentClient = prisma,
): Promise<{ id: string; number: number; title: string }> {
  const issue = await tx.issue.findUnique({
    where: { number },
    select: { id: true, number: true, title: true },
  });

  if (!issue) {
    throw new PermissionError("Issue not found.");
  }

  return issue;
}

export async function listCommentsByIssueId(
  issueId: string,
): Promise<IssueCommentRow[]> {
  return prisma.issueComment.findMany({
    where: { issueId },
    orderBy: { createdAt: "asc" },
    select: issueCommentSelect,
  });
}

export async function createIssueComment(
  input: {
    issueId: string;
    actorType?: IssueActivityActorType;
    authorUserId?: string | null;
    body: string;
    parentId?: string;
  },
  tx: IssueCommentClient = prisma,
): Promise<IssueCommentRow> {
  const actorType = input.actorType ?? "USER";
  const authorUserId = actorType === "USER" ? (input.authorUserId ?? null) : null;

  if (actorType === "USER" && !authorUserId) {
    throw new PermissionError("User comments require an author.");
  }

  if (input.parentId) {
    const parent = await tx.issueComment.findFirst({
      where: {
        id: input.parentId,
        issueId: input.issueId,
      },
      select: { id: true, parentId: true },
    });

    if (!parent) {
      throw new PermissionError("Parent comment not found.");
    }

    if (parent.parentId !== null) {
      throw new PermissionError("Replies can only be added to top-level comments.");
    }
  }

  return tx.issueComment.create({
    data: {
      issueId: input.issueId,
      actorType,
      authorUserId,
      body: input.body,
      parentId: input.parentId ?? null,
    },
    select: issueCommentSelect,
  });
}

export async function deleteIssueComment(input: {
  commentId: string;
  issueId: string;
  authorUserId: string;
}): Promise<{ body: string; replyCount: number }> {
  const comment = await prisma.issueComment.findFirst({
    where: {
      id: input.commentId,
      issueId: input.issueId,
    },
    select: {
      id: true,
      authorUserId: true,
      body: true,
      _count: { select: { replies: true } },
    },
  });

  if (!comment) {
    throw new PermissionError("Comment not found.");
  }

  if (comment.authorUserId !== input.authorUserId) {
    throw new PermissionError("You can only delete your own comments.");
  }

  await prisma.issueComment.delete({
    where: { id: input.commentId },
  });

  return {
    body: comment.body,
    replyCount: comment._count.replies,
  };
}

export async function updateIssueComment(input: {
  commentId: string;
  issueId: string;
  authorUserId: string;
  body: string;
}): Promise<{ row: IssueCommentRow; oldBody: string }> {
  const comment = await prisma.issueComment.findFirst({
    where: {
      id: input.commentId,
      issueId: input.issueId,
    },
    select: { id: true, authorUserId: true, body: true },
  });

  if (!comment) {
    throw new PermissionError("Comment not found.");
  }

  if (comment.authorUserId !== input.authorUserId) {
    throw new PermissionError("You can only edit your own comments.");
  }

  const row = await prisma.issueComment.update({
    where: { id: input.commentId },
    data: { body: input.body },
    select: issueCommentSelect,
  });

  return { row, oldBody: comment.body };
}

export async function resolveIssueWithComment(input: {
  number: number;
  actorType?: IssueActivityActorType;
  authorUserId?: string | null;
  body: string;
  fixedIn?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const issue = await assertIssueExistsByNumber(input.number, tx);
    const comment = await createIssueComment(
      {
        issueId: issue.id,
        actorType: input.actorType ?? "USER",
        authorUserId: input.authorUserId,
        body: input.body,
      },
      tx,
    );

    const updated = await tx.issue.update({
      where: { number: input.number },
      data: {
        status: "RESOLVED",
        ...(input.fixedIn ? { fixedIn: input.fixedIn } : {}),
      },
    });

    return { issue: updated, comment };
  });
}

export { issueCommentSelect };
