"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { Button } from "@/components/ui/button";
import type { EstimateNoteClient } from "@/features/estimates/lib/serialize-estimate-notes";
import { cn } from "@/lib/utils";

import { EstimateNoteComposer } from "./estimate-note-composer";

interface EstimateNoteItemProps {
  note: EstimateNoteClient;
  currentUserId: string;
  isTopLevel?: boolean;
  onReply: (parentId: string, body: string) => Promise<boolean>;
  onDelete: (noteId: string, isTopLevel: boolean) => Promise<boolean>;
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

function authorLabel(author: EstimateNoteClient["author"]): string {
  return author.name?.trim() || author.email;
}

export function EstimateNoteItem({
  note,
  currentUserId,
  isTopLevel = false,
  onReply,
  onDelete,
}: EstimateNoteItemProps) {
  const t = useTranslations("estimates");
  const locale = useLocale();
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwn = note.author.id === currentUserId;

  const handleDelete = async () => {
    const message =
      isTopLevel && note.replies.length > 0
        ? t("editor.notes.deleteConfirmWithReplies")
        : t("editor.notes.deleteConfirm");

    if (!window.confirm(message)) return;

    setIsDeleting(true);
    try {
      const ok = await onDelete(note.id, isTopLevel);
      if (!ok) {
        window.alert(t("editor.notes.error"));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReply = async (body: string) => {
    const ok = await onReply(note.id, body);
    if (ok) {
      setShowReplyComposer(false);
    } else {
      window.alert(t("editor.notes.error"));
    }
    return ok;
  };

  return (
    <div className={cn(!isTopLevel && "border-l border-border/60 pl-4")}>
      <div className="flex gap-3">
        <UserAvatar imageUrl={note.author.avatarUrl} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-foreground">
              {authorLabel(note.author)}
            </span>
            <time
              className="text-xs text-muted-foreground"
              dateTime={note.createdAt}
            >
              {formatTimestamp(note.createdAt, locale)}
            </time>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{note.body}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isTopLevel ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowReplyComposer((v) => !v)}
              >
                {t("editor.notes.reply")}
              </Button>
            ) : null}
            {isOwn ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
              >
                {t("editor.notes.delete")}
              </Button>
            ) : null}
          </div>
          {isTopLevel && showReplyComposer ? (
            <EstimateNoteComposer
              compact
              placeholder={t("editor.notes.replyPlaceholder")}
              submitLabel={t("editor.notes.submit")}
              onSubmit={handleReply}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
