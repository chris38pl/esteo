import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import type { EstimateNoteRow } from "@/features/estimates/server/notes-repository";

export type EstimateNoteAuthorClient = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  avatarPreset: AvatarPreset | null;
};

export type EstimateNoteClient = {
  id: string;
  body: string;
  createdAt: string;
  author: EstimateNoteAuthorClient;
  replies: EstimateNoteClient[];
};

function serializeAuthor(
  author: EstimateNoteRow["author"],
): EstimateNoteAuthorClient {
  return {
    id: author.id,
    name: author.name,
    email: author.email,
    avatarUrl: author.avatarUrl,
    avatarPreset: isAvatarPreset(author.avatarPreset) ? author.avatarPreset : null,
  };
}

function serializeLeaf(row: EstimateNoteRow): EstimateNoteClient {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: serializeAuthor(row.author),
    replies: [],
  };
}

export function serializeEstimateNotes(rows: EstimateNoteRow[]): EstimateNoteClient[] {
  const topLevel: EstimateNoteClient[] = [];
  const repliesByParent = new Map<string, EstimateNoteClient[]>();

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

  for (const note of topLevel) {
    note.replies = repliesByParent.get(note.id) ?? [];
  }

  return topLevel;
}

export function serializeEstimateNote(row: EstimateNoteRow): EstimateNoteClient {
  return serializeLeaf(row);
}
