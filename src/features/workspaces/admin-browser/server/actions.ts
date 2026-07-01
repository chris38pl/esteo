"use server";

import "server-only";

import type { z } from "zod";

import { prisma } from "@/db/client";
import { parseLogoUrlFromBranding } from "@/features/workspaces/server/logo-service";
import { requireAuth } from "@/server/auth/require-auth";
import { PermissionError } from "@/server/permissions/errors";
import { isPlatformAdmin } from "@/server/permissions/require-workspace";

import type { AdminWorkspaceSearchResult } from "../lib/types";
import { searchAdminWorkspacesInputSchema } from "../schemas/admin-workspace-browser";

const MIN_QUERY_LENGTH = 2;

export async function searchAdminWorkspacesAction(
  input: z.infer<typeof searchAdminWorkspacesInputSchema>,
): Promise<AdminWorkspaceSearchResult[]> {
  const parsed = searchAdminWorkspacesInputSchema.parse(input);
  const user = await requireAuth(parsed.locale);

  if (!isPlatformAdmin(user)) {
    throw new PermissionError("Only platform admins can browse workspaces.");
  }

  const query = parsed.query.trim();
  if (query.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const workspaces = await prisma.workspace.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
        { owner: { name: { contains: query, mode: "insensitive" } } },
        { owner: { email: { contains: query, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
      settings: {
        select: {
          branding: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: parsed.limit,
  });

  return workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    ownerName: workspace.owner.name,
    ownerEmail: workspace.owner.email,
    logoUrl: parseLogoUrlFromBranding(workspace.settings?.branding ?? null),
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
  }));
}
