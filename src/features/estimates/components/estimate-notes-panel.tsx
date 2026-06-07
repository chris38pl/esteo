"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { UserAvatar } from "@/components/avatars/user-avatar";
import type { EstimateNoteClient } from "@/features/estimates/lib/serialize-estimate-notes";
import {
  createEstimateNoteAction,
  deleteEstimateNoteAction,
} from "@/features/estimates/server/notes-actions";
import type { Locale } from "@/lib/locale";

import { EstimateNoteComposer } from "./estimate-note-composer";
import { EstimateNoteItem } from "./estimate-note-item";

interface EstimateNotesPanelProps {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  initialNotes: EstimateNoteClient[];
  currentUserId: string;
  currentUserAvatarUrl?: string | null;
  currentUserAvatarPreset?: AvatarPreset | null;
}

export function EstimateNotesPanel({
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
  initialNotes,
  currentUserId,
  currentUserAvatarUrl,
  currentUserAvatarPreset = null,
}: EstimateNotesPanelProps) {
  const router = useRouter();
  const t = useTranslations("estimates");
  const [notes, setNotes] = useState<EstimateNoteClient[]>(initialNotes);

  const refreshHistory = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleCreateTopLevel = useCallback(
    async (body: string) => {
      const result = await createEstimateNoteAction({
        estimateId,
        workspaceId,
        workspaceSlug,
        locale,
        body,
      });

      if (!result.success) {
        return false;
      }

      setNotes((prev) => [...prev, result.data.note]);
      refreshHistory();
      return true;
    },
    [estimateId, workspaceId, workspaceSlug, locale, refreshHistory],
  );

  const handleReply = useCallback(
    async (parentId: string, body: string) => {
      const result = await createEstimateNoteAction({
        estimateId,
        workspaceId,
        workspaceSlug,
        locale,
        body,
        parentId,
      });

      if (!result.success) {
        return false;
      }

      const reply = result.data.note;
      setNotes((prev) =>
        prev.map((note) =>
          note.id === parentId
            ? { ...note, replies: [...note.replies, reply] }
            : note,
        ),
      );
      refreshHistory();
      return true;
    },
    [estimateId, workspaceId, workspaceSlug, locale, refreshHistory],
  );

  const handleDelete = useCallback(
    async (noteId: string, isTopLevel: boolean) => {
      const result = await deleteEstimateNoteAction({
        estimateId,
        workspaceId,
        workspaceSlug,
        locale,
        noteId,
      });

      if (!result.success) {
        return false;
      }

      if (isTopLevel) {
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
      } else {
        setNotes((prev) =>
          prev.map((note) => ({
            ...note,
            replies: note.replies.filter((reply) => reply.id !== noteId),
          })),
        );
      }

      refreshHistory();
      return true;
    },
    [estimateId, workspaceId, workspaceSlug, locale, refreshHistory],
  );

  return (
    <div className="px-4 py-5">
      <div className="flex gap-3 border-b border-border/60 pb-5">
        <UserAvatar
          imageUrl={currentUserAvatarUrl}
          avatarPreset={currentUserAvatarPreset}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <EstimateNoteComposer
            placeholder={t("editor.notes.placeholder")}
            submitLabel={t("editor.notes.submit")}
            onSubmit={handleCreateTopLevel}
          />
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t("editor.notes.empty")}
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {notes.map((note) => (
            <div key={note.id} className="space-y-4">
              <EstimateNoteItem
                note={note}
                currentUserId={currentUserId}
                isTopLevel
                onReply={handleReply}
                onDelete={handleDelete}
              />
              {note.replies.length > 0 ? (
                <div className="ml-9 space-y-4">
                  {note.replies.map((reply) => (
                    <EstimateNoteItem
                      key={reply.id}
                      note={reply}
                      currentUserId={currentUserId}
                      onReply={handleReply}
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
