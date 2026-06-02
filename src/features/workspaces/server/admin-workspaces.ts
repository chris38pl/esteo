import type { User, WorkspaceAppearanceTheme, WorkspaceIndustry } from "@prisma/client";
import { randomUUID } from "crypto";

import { prisma } from "@/db/client";
import type { WorkspaceMemberPreview } from "@/features/workspaces/server/get-active-workspace-card-data";
import {
  createInvitationRecord,
  findPendingInvitation,
  logAuditEvent,
  revokeAllPendingWorkspaceInvitations,
  softDeleteWorkspaceRecord,
  updateWorkspaceRecord,
} from "@/features/workspaces/server/repository";
import { isValidWorkspaceSlug, normalizeWorkspaceSlug } from "@/features/workspaces/lib/slug";
import { isSlugAvailable, recordSlugAlias } from "@/features/workspaces/server/slug-availability";
import { buildPaginatedResult, toPrismaSkipTake } from "@/lib/pagination";
import type { PaginatedResult, PaginationParams } from "@/lib/pagination";
import { isPlatformAdmin } from "@/server/permissions/require-workspace";
import { PermissionError, WorkspaceError } from "@/server/permissions/errors";

const INVITATION_TTL_DAYS = 7;
const MEMBER_PREVIEW_LIMIT = 4;

export type AdminWorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  appearanceTheme: WorkspaceAppearanceTheme;
  industry: WorkspaceIndustry;
  industryOtherText: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  estimateRequestCount: number;
  estimateCount: number;
  memberCount: number;
  memberPreviews: WorkspaceMemberPreview[];
};

function assertPlatformAdminUser(user: User): void {
  if (!isPlatformAdmin(user)) {
    throw new PermissionError("Platform admin access required.");
  }
}

export async function listAdminWorkspacesPaginated(
  params: PaginationParams,
  filters?: { search?: string },
): Promise<PaginatedResult<AdminWorkspaceRow>> {
  const search = filters?.search?.trim();
  const where =
    search && search.length > 0
      ? {
          deletedAt: null,
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
            { owner: { email: { contains: search, mode: "insensitive" as const } } },
            { owner: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : { deletedAt: null };

  const take = params.pageSize;

  const [initialWorkspaces, totalCount] = await prisma.$transaction([
    prisma.workspace.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: toPrismaSkipTake(params).skip,
      take,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          where: { deletedAt: null },
          take: MEMBER_PREVIEW_LIMIT,
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: {
            estimateRequests: true,
            estimates: true,
            members: { where: { deletedAt: null } },
          },
        },
      },
    }),
    prisma.workspace.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / params.pageSize));
  const normalizedPage = Math.min(params.page, totalPages);

  const workspaces =
    normalizedPage === params.page
      ? initialWorkspaces
      : await prisma.workspace.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: toPrismaSkipTake({ ...params, page: normalizedPage }).skip,
          take,
          include: {
            owner: {
              select: { id: true, name: true, email: true },
            },
            members: {
              where: { deletedAt: null },
              take: MEMBER_PREVIEW_LIMIT,
              orderBy: { createdAt: "asc" },
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
            _count: {
              select: {
                estimateRequests: true,
                estimates: true,
                members: { where: { deletedAt: null } },
              },
            },
          },
        });

  const rows: AdminWorkspaceRow[] = workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    appearanceTheme: workspace.appearanceTheme,
    industry: workspace.industry,
    industryOtherText: workspace.industryOtherText,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    owner: workspace.owner,
    estimateRequestCount: workspace._count.estimateRequests,
    estimateCount: workspace._count.estimates,
    memberCount: workspace._count.members,
    memberPreviews: workspace.members.map((member) => ({
      id: member.user.id,
      name: member.user.name ?? member.user.email,
      imageUrl: member.user.avatarUrl,
    })),
  }));

  return buildPaginatedResult(rows, totalCount, { ...params, page: normalizedPage });
}

export async function adminUpdateWorkspace(
  admin: User,
  workspaceId: string,
  input: { name: string; slug: string },
) {
  assertPlatformAdminUser(admin);

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
  });

  if (!workspace) {
    throw new WorkspaceError("Workspace not found.");
  }

  const name = input.name.trim();
  const slug = normalizeWorkspaceSlug(input.slug);

  if (!name) {
    throw new WorkspaceError("Workspace name is required.");
  }

  if (!isValidWorkspaceSlug(slug)) {
    throw new WorkspaceError("Invalid workspace slug.");
  }

  if (!(await isSlugAvailable(slug, workspaceId))) {
    throw new WorkspaceError("Workspace slug is already taken.");
  }

  const oldSlug = workspace.slug;
  if (oldSlug !== slug) {
    await recordSlugAlias(workspaceId, oldSlug);
  }

  const updated = await updateWorkspaceRecord(workspaceId, { name, slug });

  await logAuditEvent({
    actorUserId: admin.id,
    workspaceId,
    entityType: "Workspace",
    entityId: workspaceId,
    action: "admin_updated",
    diff: { name, slug },
  });

  return updated;
}

export async function adminArchiveWorkspace(admin: User, workspaceId: string) {
  assertPlatformAdminUser(admin);

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
  });

  if (!workspace) {
    throw new WorkspaceError("Workspace not found.");
  }

  await revokeAllPendingWorkspaceInvitations(workspaceId);
  const archived = await softDeleteWorkspaceRecord(workspaceId);

  await logAuditEvent({
    actorUserId: admin.id,
    workspaceId,
    entityType: "Workspace",
    entityId: workspaceId,
    action: "admin_archived",
  });

  return archived;
}

export async function adminInviteToWorkspace(
  admin: User,
  workspaceId: string,
  email: string,
) {
  assertPlatformAdminUser(admin);

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
  });

  if (!workspace) {
    throw new WorkspaceError("Workspace not found.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new WorkspaceError("Email is required.");
  }

  const pending = await findPendingInvitation(workspaceId, normalizedEmail);

  if (pending) {
    throw new WorkspaceError("An invitation is already pending for this email.");
  }

  const invitation = await createInvitationRecord({
    workspaceId,
    email: normalizedEmail,
    role: "MEMBER",
    token: randomUUID(),
    invitedById: admin.id,
    expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  await logAuditEvent({
    actorUserId: admin.id,
    workspaceId,
    entityType: "WorkspaceInvitation",
    entityId: invitation.id,
    action: "admin_created",
  });

  return invitation;
}
