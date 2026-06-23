"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { UserAvatar } from "@/components/avatars/user-avatar";
import { Button } from "@/components/ui/button";
import type { IssueCommentClient } from "@/features/issues/lib/serialize-issue-comments";
import {
  createIssueCommentAction,
  deleteIssueCommentAction,
  updateIssueCommentAction,
} from "@/features/issues/server/comments-actions";
import type { Locale } from "@/lib/locale";

import { IssueCommentComposer } from "./issue-comment-composer";
import { IssueCommentItem } from "./issue-comment-item";

const INITIAL_VISIBLE_COMMENTS = 5;

interface IssueCommentsPanelProps {
  issueNumber: number;
  locale: Locale;
  initialComments: IssueCommentClient[];
  currentUserId: string;
  currentUserAvatarUrl?: string | null;
  currentUserAvatarPreset?: AvatarPreset | null;
}

export function IssueCommentsPanel({
  issueNumber,
  locale,
  initialComments,
  currentUserId,
  currentUserAvatarUrl,
  currentUserAvatarPreset = null,
}: IssueCommentsPanelProps) {
  const router = useRouter();
  const t = useTranslations("issues");
  const [comments, setComments] = useState<IssueCommentClient[]>(initialComments);
  const [showOlder, setShowOlder] = useState(false);

  const refreshIssue = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleCreateTopLevel = useCallback(
    async (body: string) => {
      const result = await createIssueCommentAction(
        {
          number: issueNumber,
          body,
        },
        locale,
      );

      if (!result.success) {
        return false;
      }

      setComments((prev) => [...prev, result.data.comment]);
      refreshIssue();
      return true;
    },
    [issueNumber, locale, refreshIssue],
  );

  const handleReply = useCallback(
    async (parentId: string, body: string) => {
      const result = await createIssueCommentAction(
        {
          number: issueNumber,
          body,
          parentId,
        },
        locale,
      );

      if (!result.success) {
        return false;
      }

      const reply = result.data.comment;
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === parentId
            ? { ...comment, replies: [...comment.replies, reply] }
            : comment,
        ),
      );
      refreshIssue();
      return true;
    },
    [issueNumber, locale, refreshIssue],
  );

  const handleDelete = useCallback(
    async (commentId: string, isTopLevel: boolean) => {
      const result = await deleteIssueCommentAction(
        {
          number: issueNumber,
          commentId,
        },
        locale,
      );

      if (!result.success) {
        return false;
      }

      if (isTopLevel) {
        setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      } else {
        setComments((prev) =>
          prev.map((comment) => ({
            ...comment,
            replies: comment.replies.filter((reply) => reply.id !== commentId),
          })),
        );
      }

      refreshIssue();
      return true;
    },
    [issueNumber, locale, refreshIssue],
  );

  const handleEdit = useCallback(
    async (commentId: string, body: string) => {
      const result = await updateIssueCommentAction(
        {
          number: issueNumber,
          commentId,
          body,
        },
        locale,
      );

      if (!result.success) {
        return false;
      }

      const updated = result.data.comment;
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            return { ...updated, replies: comment.replies };
          }

          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === commentId ? updated : reply,
            ),
          };
        }),
      );
      refreshIssue();
      return true;
    },
    [issueNumber, locale, refreshIssue],
  );

  const hiddenCount = Math.max(0, comments.length - INITIAL_VISIBLE_COMMENTS);
  const visibleComments = showOlder
    ? comments
    : comments.slice(Math.max(0, comments.length - INITIAL_VISIBLE_COMMENTS));

  return (
    <div className="px-4 py-5">
      <div className="flex gap-3 border-b border-border/60 pb-5">
        <UserAvatar
          imageUrl={currentUserAvatarUrl}
          avatarPreset={currentUserAvatarPreset}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <IssueCommentComposer
            placeholder={t("admin.comments.placeholder")}
            submitLabel={t("admin.comments.submit")}
            onSubmit={handleCreateTopLevel}
          />
        </div>
      </div>

      {comments.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t("admin.comments.empty")}
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {hiddenCount > 0 && !showOlder ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setShowOlder(true)}
            >
              {t("admin.comments.viewOlder", { count: hiddenCount })}
            </Button>
          ) : null}

          {visibleComments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              <IssueCommentItem
                comment={comment}
                currentUserId={currentUserId}
                isTopLevel
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              {comment.replies.length > 0 ? (
                <div className="ml-9 space-y-4">
                  {comment.replies.map((reply) => (
                    <IssueCommentItem
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      onReply={handleReply}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
