"use server";

import "server-only";

import type { z } from "zod";

import { prisma } from "@/db/client";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { requireWorkspace } from "@/server/permissions/require-workspace";

import type { RecentDocumentItem, SearchWorkspaceResult } from "../lib/search-types";
import {
  listRecentDocumentsInputSchema,
  recordRecentDocumentInputSchema,
  searchWorkspaceInputSchema,
} from "../schemas/search";
import { listRecentDocuments, recordRecentDocument } from "./recent-documents-service";
import { searchWorkspace } from "./service";

async function getWorkspaceSlug(workspaceId: string): Promise<string> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { slug: true },
  });
  return workspace.slug;
}

export async function searchWorkspaceAction(
  input: z.infer<typeof searchWorkspaceInputSchema>,
): Promise<SearchWorkspaceResult> {
  const parsed = searchWorkspaceInputSchema.parse(input);
  const user = await requireAuth(parsed.locale);
  await requireWorkspace(user, parsed.workspaceId);

  if (parsed.query.trim().length < 2) {
    return { estimates: [], inquiries: [], attachments: [], tips: [] };
  }

  const workspaceSlug = await getWorkspaceSlug(parsed.workspaceId);

  return searchWorkspace({
    workspaceId: parsed.workspaceId,
    query: parsed.query,
    locale: parsed.locale as Locale,
    workspaceSlug,
  });
}

export async function listRecentDocumentsAction(
  input: z.infer<typeof listRecentDocumentsInputSchema>,
): Promise<RecentDocumentItem[]> {
  const parsed = listRecentDocumentsInputSchema.parse(input);
  const user = await requireAuth(parsed.locale);
  await requireWorkspace(user, parsed.workspaceId);
  const workspaceSlug = await getWorkspaceSlug(parsed.workspaceId);

  return listRecentDocuments({
    userId: user.id,
    workspaceId: parsed.workspaceId,
    locale: parsed.locale as Locale,
    workspaceSlug,
  });
}

export async function recordRecentDocumentAction(
  input: z.infer<typeof recordRecentDocumentInputSchema>,
): Promise<void> {
  const parsed = recordRecentDocumentInputSchema.parse(input);
  const user = await requireAuth(parsed.locale);
  await requireWorkspace(user, parsed.workspaceId);

  await recordRecentDocument({
    userId: user.id,
    workspaceId: parsed.workspaceId,
    entityType: parsed.entityType,
    entityId: parsed.entityId,
    title: parsed.title,
    subtitle: parsed.subtitle,
    iconType: parsed.iconType,
  });
}
