import "server-only";

import { z } from "zod";

import { prisma } from "@/db/client";
import {
  createInternalEstimateCreateSchema,
  createPublicEstimateRequestSchema,
  type InternalEstimateCreateInput,
  type PublicEstimateRequestInput,
} from "@/features/estimate-requests/schemas/request";
import { resolvePublicWorkspaceBySlug } from "@/server/workspaces/resolve-public-slug";

const workspaceSlugSchema = z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/);

export type ParsePublicEstimateRequestResult =
  | { success: true; data: PublicEstimateRequestInput }
  | { success: false; error: "invalid" | "unavailable" };

export async function parsePublicEstimateRequestBody(
  bodyJson: unknown,
): Promise<ParsePublicEstimateRequestResult> {
  if (!bodyJson || typeof bodyJson !== "object" || !("workspaceSlug" in bodyJson)) {
    return { success: false, error: "invalid" };
  }

  const slugResult = workspaceSlugSchema.safeParse(
    (bodyJson as { workspaceSlug: unknown }).workspaceSlug,
  );

  if (!slugResult.success) {
    return { success: false, error: "invalid" };
  }

  const resolved = await resolvePublicWorkspaceBySlug(slugResult.data);

  if (!resolved) {
    return { success: false, error: "unavailable" };
  }

  const workspace = await prisma.workspace.findFirst({
    where: { id: resolved.workspaceId, deletedAt: null },
    select: { industry: true },
  });

  if (!workspace) {
    return { success: false, error: "unavailable" };
  }

  const parsed = createPublicEstimateRequestSchema(workspace.industry).safeParse(bodyJson);

  if (!parsed.success) {
    return { success: false, error: "invalid" };
  }

  return { success: true, data: parsed.data as PublicEstimateRequestInput };
}

export type ParseInternalEstimateCreateResult =
  | { success: true; data: InternalEstimateCreateInput }
  | { success: false; error: "invalid" | "unavailable" };

export async function parseInternalEstimateCreateBody(
  workspaceId: string,
  payload: unknown,
): Promise<ParseInternalEstimateCreateResult> {
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    select: { industry: true },
  });

  if (!workspace) {
    return { success: false, error: "unavailable" };
  }

  const parsed = createInternalEstimateCreateSchema(workspace.industry).safeParse(payload);

  if (!parsed.success) {
    return { success: false, error: "invalid" };
  }

  return { success: true, data: parsed.data as InternalEstimateCreateInput };
}
