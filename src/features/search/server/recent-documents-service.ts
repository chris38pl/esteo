import "server-only";

import type { SearchEntityType, SearchIconType } from "@prisma/client";

import { prisma } from "@/db/client";
import type { Locale } from "@/lib/locale";

import { buildSearchUrl } from "../lib/search-url";
import type { RecentDocumentItem, SearchDocumentMetadata } from "../lib/search-types";
import { findSearchDocument } from "./repository";

const MAX_RECENT_DOCUMENTS = 20;

export async function listRecentDocuments(input: {
  userId: string;
  workspaceId: string;
  locale: Locale;
  workspaceSlug: string;
}): Promise<RecentDocumentItem[]> {
  const recents = await prisma.userRecentDocument.findMany({
    where: {
      userId: input.userId,
      workspaceId: input.workspaceId,
    },
    orderBy: { lastOpenedAt: "desc" },
    take: MAX_RECENT_DOCUMENTS,
  });

  const items: RecentDocumentItem[] = [];

  for (const recent of recents) {
    const live = await findSearchDocument(
      input.workspaceId,
      recent.entityType,
      recent.entityId,
    );

    const metadata = (live?.metadata ?? null) as SearchDocumentMetadata | null;
    const title = live && !live.deletedAt ? live.title : recent.titleSnapshot;
    const subtitle =
      live && !live.deletedAt ? (live.subtitle ?? undefined) : (recent.subtitleSnapshot ?? undefined);
    const iconType: SearchIconType =
      live && !live.deletedAt ? live.iconType : recent.iconTypeSnapshot;

    items.push({
      id: recent.entityId,
      entityType: recent.entityType,
      iconType,
      title,
      subtitle,
      url: buildSearchUrl({
        entityType: recent.entityType,
        entityId: recent.entityId,
        workspaceSlug: input.workspaceSlug,
        locale: input.locale,
        metadata,
      }),
      lastOpenedAt: recent.lastOpenedAt.toISOString(),
    });
  }

  return items;
}

export async function recordRecentDocument(input: {
  userId: string;
  workspaceId: string;
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  subtitle?: string;
  iconType: SearchIconType;
}): Promise<void> {
  await prisma.userRecentDocument.upsert({
    where: {
      userId_workspaceId_entityType_entityId: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    },
    create: {
      userId: input.userId,
      workspaceId: input.workspaceId,
      entityType: input.entityType,
      entityId: input.entityId,
      titleSnapshot: input.title,
      subtitleSnapshot: input.subtitle ?? null,
      iconTypeSnapshot: input.iconType,
      lastOpenedAt: new Date(),
    },
    update: {
      titleSnapshot: input.title,
      subtitleSnapshot: input.subtitle ?? null,
      iconTypeSnapshot: input.iconType,
      lastOpenedAt: new Date(),
    },
  });

  const overflow = await prisma.userRecentDocument.findMany({
    where: {
      userId: input.userId,
      workspaceId: input.workspaceId,
    },
    orderBy: { lastOpenedAt: "desc" },
    skip: MAX_RECENT_DOCUMENTS,
    select: { id: true },
  });

  if (overflow.length > 0) {
    await prisma.userRecentDocument.deleteMany({
      where: { id: { in: overflow.map((row) => row.id) } },
    });
  }
}
