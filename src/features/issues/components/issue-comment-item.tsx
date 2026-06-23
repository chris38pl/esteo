"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { Button } from "@/components/ui/button";
import type { IssueCommentClient } from "@/features/issues/lib/serialize-issue-comments";
import { ISSUE_COMMENT_BODY_MAX_LENGTH } from "@/features/issues/schemas/issue-comment";
import { cn } from "@/lib/utils";

import { IssueCommentComposer } from "./issue-comment-composer";

interface IssueCommentItemProps {
  comment: IssueCommentClient;
  currentUserId: string;
  isTopLevel?: boolean;
  onReply: (parentId: string, body: string) => Promise<boolean>;
  onEdit: (commentId: string, body: string) => Promise<boolean>;
  onDelete: (commentId: string, isTopLevel: boolean) => Promise<boolean>;
}

function formatTimestamp(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function authorLabel(
  comment: IssueCommentClient,
  t: ReturnType<typeof useTranslations<"issues">>,
): string {
  if (comment.actorType === "CURSOR_AI") {
    return t("admin.history.actorCursorAi");
  }

  if (!comment.author) {
    return t("admin.history.actorSystem");
  }

  return comment.author.name?.trim() || comment.author.email;
}

export function IssueCommentItem({
  comment,
  currentUserId,
  isTopLevel = false,
  onReply,
  onEdit,
  onDelete,
}: IssueCommentItemProps) {
  const t = useTranslations("issues");
  const locale = useLocale();
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const isOwn = comment.author?.id === currentUserId;

  const handleDelete = async () => {
    const message =
      isTopLevel && comment.replies.length > 0
        ? t("admin.comments.deleteConfirmWithReplies")
        : t("admin.comments.deleteConfirm");

    if (!window.confirm(message)) return;

    setIsDeleting(true);
    try {
      const ok = await onDelete(comment.id, isTopLevel);
      if (!ok) {
        window.alert(t("admin.comments.error"));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReply = async (body: string) => {
    const ok = await onReply(comment.id, body);
    if (ok) {
      setShowReplyComposer(false);
    } else {
      window.alert(t("admin.comments.error"));
    }
    return ok;
  };

  const handleEdit = async () => {
    const trimmed = editBody.trim();
    if (!trimmed) return;

    setIsSavingEdit(true);
    try {
      const ok = await onEdit(comment.id, trimmed);
      if (ok) {
        setIsEditing(false);
      } else {
        window.alert(t("admin.comments.error"));
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className={cn(!isTopLevel && "border-l border-border/60 pl-4")}>
      <div className="flex gap-3">
        {comment.author ? (
          <UserAvatar
            imageUrl={comment.author.avatarUrl}
            avatarPreset={comment.author.avatarPreset}
            size={36}
          />
        ) : (
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold uppercase text-primary ring-1 ring-primary/15"
            aria-hidden
          >
            AI
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-foreground">
              {authorLabel(comment, t)}
            </span>
            <time className="text-xs text-muted-foreground" dateTime={comment.createdAt}>
              {formatTimestamp(comment.createdAt, locale)}
            </time>
          </div>
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editBody}
                onChange={(event) => setEditBody(event.target.value)}
                maxLength={ISSUE_COMMENT_BODY_MAX_LENGTH}
                rows={3}
                className={cn(
                  "min-h-[4.5rem] w-full resize-y rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                )}
                disabled={isSavingEdit}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditBody(comment.body);
                    setIsEditing(false);
                  }}
                  disabled={isSavingEdit}
                >
                  {t("form.cancel")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleEdit()}
                  disabled={isSavingEdit || editBody.trim().length === 0}
                >
                  {isSavingEdit ? t("admin.comments.saving") : t("admin.comments.save")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isTopLevel ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowReplyComposer((value) => !value)}
              >
                {t("admin.comments.reply")}
              </Button>
            ) : null}
            {isOwn ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  disabled={isDeleting || isEditing}
                  onClick={() => {
                    setEditBody(comment.body);
                    setIsEditing(true);
                  }}
                >
                  {t("admin.comments.edit")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  disabled={isDeleting}
                  onClick={() => void handleDelete()}
                >
                  {t("admin.comments.delete")}
                </Button>
              </>
            ) : null}
          </div>
          {isTopLevel && showReplyComposer ? (
            <IssueCommentComposer
              compact
              placeholder={t("admin.comments.replyPlaceholder")}
              submitLabel={t("admin.comments.submit")}
              onSubmit={handleReply}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
