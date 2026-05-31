import type { User, WorkspaceAppearanceTheme } from "@prisma/client";
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
import { isPlatformAdmin } from "@/server/permissions/require-workspace";
import { PermissionError, WorkspaceError } from "@/server/permissions/errors";

const INVITATION_TTL_DAYS = 7;
const MEMBER_PREVIEW_LIMIT = 4;

export type AdminWorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  appearanceTheme: WorkspaceAppearanceTheme;
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

export async function listAdminWorkspaces(): Promise<AdminWorkspaceRow[]> {
  const workspaces = await prisma.workspace.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
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

  return workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    appearanceTheme: workspace.appearanceTheme,
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

  const slugOwner = await prisma.workspace.findUnique({ where: { slug } });

  if (slugOwner && slugOwner.id !== workspaceId) {
    throw new WorkspaceError("Workspace slug is already taken.");
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
