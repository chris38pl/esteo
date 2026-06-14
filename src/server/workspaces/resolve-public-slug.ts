import { cache } from "react";

import { prisma } from "@/db/client";

export type ResolvedPublicWorkspaceSlug = {
  workspaceId: string;
  canonicalSlug: string;
  matchedViaAlias: boolean;
};

/**
 * Resolves a workspace by its public URL slug (e.g. `/pl/wycena/{slug}`).
 * Checks active slug first, then WorkspaceSlugAlias for retired slugs.
 */
export const resolvePublicWorkspaceBySlug = cache(
  async (slug: string): Promise<ResolvedPublicWorkspaceSlug | null> => {
    const direct = await prisma.workspace.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true, slug: true },
    });

    if (direct) {
      return {
        workspaceId: direct.id,
        canonicalSlug: direct.slug,
        matchedViaAlias: false,
      };
    }

    const alias = await prisma.workspaceSlugAlias.findUnique({
      where: { slug },
      include: { workspace: { select: { id: true, slug: true, deletedAt: true } } },
    });

    if (!alias || alias.workspace.deletedAt) {
      return null;
    }

    return {
      workspaceId: alias.workspace.id,
      canonicalSlug: alias.workspace.slug,
      matchedViaAlias: true,
    };
  },
);
