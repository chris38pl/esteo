import type {
  InviteRole,
  Prisma,
  WorkspaceAppearanceTheme,
  WorkspaceIndustry,
  WorkspaceLocale,
  WorkspaceRuleType,
} from "@prisma/client";

import { prisma } from "@/db/client";
import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import { inviteRoleToWorkspaceRole } from "@/features/workspaces/lib/invite-role";

export async function findWorkspaceById(workspaceId: string) {
  return prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    include: {
      settings: true,
      billingAccount: { include: { subscription: true } },
    },
  });
}

export async function listWorkspacesForUser(userId: string) {
  return prisma.workspace.findMany({
    where: {
      deletedAt: null,
      members: {
        some: { userId, deletedAt: null },
      },
    },
    orderBy: { createdAt: "asc" },
    include: { settings: true },
  });
}

export async function updateWorkspaceAppearanceRecord(
  workspaceId: string,
  appearanceTheme: import("@prisma/client").WorkspaceAppearanceTheme,
) {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { appearanceTheme },
  });
}

export async function createWorkspaceRecord(input: {
  billingAccountId: string;
  ownerId: string;
  name: string;
  slug: string;
  industry: WorkspaceIndustry;
  industryOtherText?: string | null;
  defaultLocale: WorkspaceLocale;
  appearanceTheme?: WorkspaceAppearanceTheme;
  branding?: WorkspaceBranding;
  aiInstructions?: string;
  companyDescription?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        billingAccountId: input.billingAccountId,
        ownerId: input.ownerId,
        name: input.name,
        slug: input.slug,
        industry: input.industry,
        industryOtherText:
          input.industry === "OTHER" ? input.industryOtherText?.trim() ?? null : null,
        defaultLocale: input.defaultLocale,
        ...(input.appearanceTheme != null
          ? { appearanceTheme: input.appearanceTheme }
          : {}),
        settings: {
          create: {
            branding: input.branding ?? undefined,
            aiInstructions: input.aiInstructions,
            companyDescription: input.companyDescription ?? undefined,
          },
        },
        members: {
          create: {
            userId: input.ownerId,
            role: "OWNER",
          },
        },
      },
      include: { settings: true },
    });

    return workspace;
  });
}

export async function updateWorkspaceRecord(
  workspaceId: string,
  data: Prisma.WorkspaceUpdateInput,
) {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
    include: { settings: true },
  });
}

export async function softDeleteWorkspaceRecord(workspaceId: string) {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { deletedAt: new Date() },
  });
}

export async function findWorkspaceSettings(workspaceId: string) {
  return prisma.workspaceSettings.findUnique({
    where: { workspaceId },
  });
}

export async function updateWorkspaceSettingsRecord(
  workspaceId: string,
  data: {
    branding?: WorkspaceBranding | null;
    aiInstructions?: string | null;
    companyDescription?: string | null;
    companyAddress?: string | null;
    companyTaxId?: string | null;
    companyEmail?: string | null;
    companyPhone?: string | null;
  },
) {
  return prisma.workspaceSettings.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      branding: data.branding ?? undefined,
      aiInstructions: data.aiInstructions ?? undefined,
      companyDescription: data.companyDescription ?? undefined,
      companyAddress: data.companyAddress ?? undefined,
      companyTaxId: data.companyTaxId ?? undefined,
      companyEmail: data.companyEmail ?? undefined,
      companyPhone: data.companyPhone ?? undefined,
    },
    update: {
      branding: data.branding ?? undefined,
      aiInstructions: data.aiInstructions ?? undefined,
      companyDescription: data.companyDescription ?? undefined,
      companyAddress: data.companyAddress ?? undefined,
      companyTaxId: data.companyTaxId ?? undefined,
      companyEmail: data.companyEmail ?? undefined,
      companyPhone: data.companyPhone ?? undefined,
    },
  });
}

export async function listWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId, deletedAt: null },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function softDeleteWorkspaceMemberMembership(
  userId: string,
  workspaceId: string,
) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId, deletedAt: null },
  });

  if (!membership) {
    return null;
  }

  return prisma.workspaceMember.update({
    where: { id: membership.id },
    data: { deletedAt: new Date() },
  });
}

export async function listPendingWorkspaceInvitations(workspaceId: string) {
  return prisma.workspaceInvitation.findMany({
    where: { workspaceId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export async function listActiveWorkspaceRules(
  workspaceId: string,
  locale?: WorkspaceLocale,
) {
  return prisma.workspaceRule.findMany({
    where: {
      workspaceId,
      active: true,
      deletedAt: null,
      OR: locale ? [{ locale: null }, { locale }] : undefined,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createWorkspaceRuleRecord(input: {
  workspaceId: string;
  type: WorkspaceRuleType;
  locale?: WorkspaceLocale | null;
  title: string;
  content: string;
  sortOrder?: number;
}) {
  return prisma.workspaceRule.create({
    data: {
      workspaceId: input.workspaceId,
      type: input.type,
      locale: input.locale ?? undefined,
      title: input.title,
      content: input.content,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateWorkspaceRuleRecord(
  ruleId: string,
  data: Prisma.WorkspaceRuleUpdateInput,
) {
  return prisma.workspaceRule.update({
    where: { id: ruleId },
    data,
  });
}

export async function softDeleteWorkspaceRuleRecord(ruleId: string) {
  return prisma.workspaceRule.update({
    where: { id: ruleId },
    data: { deletedAt: new Date(), active: false },
  });
}

export async function findPendingInvitation(workspaceId: string, email: string) {
  return prisma.workspaceInvitation.findFirst({
    where: {
      workspaceId,
      email: email.toLowerCase(),
      status: "PENDING",
    },
  });
}

export async function createInvitationRecord(input: {
  workspaceId: string;
  email: string;
  role: InviteRole;
  token: string;
  invitedById: string;
  expiresAt: Date;
}) {
  return prisma.workspaceInvitation.create({
    data: {
      workspaceId: input.workspaceId,
      email: input.email.toLowerCase(),
      role: input.role,
      token: input.token,
      invitedById: input.invitedById,
      expiresAt: input.expiresAt,
    },
  });
}

export async function findInvitationByToken(token: string) {
  return prisma.workspaceInvitation.findUnique({
    where: { token },
    include: { workspace: true },
  });
}

export async function acceptInvitationRecord(input: {
  invitationId: string;
  workspaceId: string;
  userId: string;
  role: InviteRole;
  invitedById: string;
}) {
  const memberRole = inviteRoleToWorkspaceRole(input.role);

  return prisma.$transaction(async (tx) => {
    await tx.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: input.workspaceId,
          userId: input.userId,
        },
      },
      create: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        role: memberRole,
        invitedById: input.invitedById,
      },
      update: {
        deletedAt: null,
        role: memberRole,
        invitedById: input.invitedById,
      },
    });

    return tx.workspaceInvitation.update({
      where: { id: input.invitationId },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });
  });
}

export async function revokeInvitationRecord(invitationId: string) {
  return prisma.workspaceInvitation.update({
    where: { id: invitationId },
    data: { status: "REVOKED" },
  });
}

export async function revokeAllPendingWorkspaceInvitations(workspaceId: string) {
  return prisma.workspaceInvitation.updateMany({
    where: { workspaceId, status: "PENDING" },
    data: { status: "REVOKED" },
  });
}

export async function logAuditEvent(input: {
  actorUserId: string;
  workspaceId?: string;
  entityType: string;
  entityId: string;
  action: string;
  diff?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      workspaceId: input.workspaceId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      diff: input.diff,
    },
  });
}
