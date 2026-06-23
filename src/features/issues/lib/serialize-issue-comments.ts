import type { AvatarPreset } from "@/components/avatars/user-avatar";
import type { IssueActivityActorType } from "@/features/issues/lib/issue-activity-types";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import type { IssueCommentRow } from "@/features/issues/server/comments-repository";

export type IssueCommentAuthorClient = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  avatarPreset: AvatarPreset | null;
};

export type IssueCommentClient = {
  id: string;
  actorType: IssueActivityActorType;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: IssueCommentAuthorClient | null;
  replies: IssueCommentClient[];
};

function serializeAuthor(author: IssueCommentRow["author"]): IssueCommentAuthorClient {
  if (!author) {
    throw new Error("Cannot serialize missing issue comment author as user.");
  }

  return {
    id: author.id,
    name: author.name,
    email: author.email,
    avatarUrl: author.avatarUrl,
    avatarPreset: isAvatarPreset(author.avatarPreset) ? author.avatarPreset : null,
  };
}

function serializeLeaf(row: IssueCommentRow): IssueCommentClient {
  return {
    id: row.id,
    actorType: row.actorType,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    author: row.author ? serializeAuthor(row.author) : null,
    replies: [],
  };
}

export function serializeIssueComments(rows: IssueCommentRow[]): IssueCommentClient[] {
  const topLevel: IssueCommentClient[] = [];
  const repliesByParent = new Map<string, IssueCommentClient[]>();

  for (const row of rows) {
    if (row.parentId) {
      const reply = serializeLeaf(row);
      const bucket = repliesByParent.get(row.parentId) ?? [];
      bucket.push(reply);
      repliesByParent.set(row.parentId, bucket);
      continue;
    }

    topLevel.push(serializeLeaf(row));
  }

  for (const comment of topLevel) {
    comment.replies = repliesByParent.get(comment.id) ?? [];
  }

  return topLevel;
}

export function serializeIssueComment(row: IssueCommentRow): IssueCommentClient {
  return serializeLeaf(row);
}
