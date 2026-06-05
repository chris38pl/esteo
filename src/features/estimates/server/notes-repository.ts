import "server-only";

import { prisma } from "@/db/client";
import { PermissionError } from "@/server/permissions/errors";

const authorSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

export type EstimateNoteRow = {
  id: string;
  estimateId: string;
  parentId: string | null;
  authorUserId: string;
  body: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
};

export async function assertEstimateInWorkspace(
  estimateId: string,
  workspaceId: string,
): Promise<void> {
  const estimate = await prisma.estimate.findFirst({
    where: {
      id: estimateId,
      workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!estimate) {
    throw new PermissionError("Estimate not found.");
  }
}

export async function listNotesByEstimateId(
  estimateId: string,
): Promise<EstimateNoteRow[]> {
  return prisma.estimateNote.findMany({
    where: { estimateId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      estimateId: true,
      parentId: true,
      authorUserId: true,
      body: true,
      createdAt: true,
      author: { select: authorSelect },
    },
  });
}

export async function createEstimateNote(input: {
  estimateId: string;
  authorUserId: string;
  body: string;
  parentId?: string;
}): Promise<EstimateNoteRow> {
  if (input.parentId) {
    const parent = await prisma.estimateNote.findFirst({
      where: {
        id: input.parentId,
        estimateId: input.estimateId,
      },
      select: { id: true, parentId: true },
    });

    if (!parent) {
      throw new PermissionError("Parent note not found.");
    }

    if (parent.parentId !== null) {
      throw new PermissionError("Replies can only be added to top-level notes.");
    }
  }

  return prisma.estimateNote.create({
    data: {
      estimateId: input.estimateId,
      authorUserId: input.authorUserId,
      body: input.body,
      parentId: input.parentId ?? null,
    },
    select: {
      id: true,
      estimateId: true,
      parentId: true,
      authorUserId: true,
      body: true,
      createdAt: true,
      author: { select: authorSelect },
    },
  });
}

export async function deleteEstimateNote(input: {
  noteId: string;
  estimateId: string;
  authorUserId: string;
}): Promise<void> {
  const note = await prisma.estimateNote.findFirst({
    where: {
      id: input.noteId,
      estimateId: input.estimateId,
    },
    select: { id: true, authorUserId: true },
  });

  if (!note) {
    throw new PermissionError("Note not found.");
  }

  if (note.authorUserId !== input.authorUserId) {
    throw new PermissionError("You can only delete your own notes.");
  }

  await prisma.estimateNote.delete({
    where: { id: input.noteId },
  });
}
