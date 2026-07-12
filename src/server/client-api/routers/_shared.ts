import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export const workspaceSlugInput = z.object({
  workspaceSlug: z.string().min(2),
});

/**
 * Resolves a workspace by slug for the caller, or throws NOT_FOUND. Access
 * control lives entirely in `resolveWorkspaceBySlug` (returns null when the
 * user has no access) — the router does not re-authorize.
 */
export async function resolveWorkspaceOr404(slug: string, userId: string) {
  const resolved = await resolveWorkspaceBySlug(slug, userId);
  if (!resolved) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found." });
  }
  return resolved.workspace;
}
