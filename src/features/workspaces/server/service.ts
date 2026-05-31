import type {
  InviteRole,
  User,
  WorkspaceAppearanceTheme,
  WorkspaceIndustry,
  WorkspaceLocale,
  WorkspaceRuleType,
} from "@prisma/client";
import { randomUUID } from "crypto";

import { ensureBillingAccount } from "@/features/billing/server/provision-billing-account";
import { countAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import { isValidWorkspaceSlug, normalizeWorkspaceSlug } from "@/features/workspaces/lib/slug";
import {
  findReceivedInvitationById,
  listReceivedInvitations,
} from "@/features/workspaces/server/invitation-inbox";
import {
  acceptInvitationRecord,
  createInvitationRecord,
  createWorkspaceRecord,
  createWorkspaceRuleRecord,
  findInvitationByToken,
  findPendingInvitation,
  findWorkspaceById,
  findWorkspaceSettings,
  listActiveWorkspaceRules,
  listWorkspacesForUser,
  listWorkspaceMembers,
  logAuditEvent,
  revokeInvitationRecord,
  revokeAllPendingWorkspaceInvitations,
  softDeleteWorkspaceMemberMembership,
  softDeleteWorkspaceRecord,
  softDeleteWorkspaceRuleRecord,
  updateWorkspaceAppearanceRecord,
  updateWorkspaceRecord,
  updateWorkspaceRuleRecord,
  updateWorkspaceSettingsRecord,
} from "@/features/workspaces/server/repository";
import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import { parseCompanyDescription } from "@/features/workspaces/schemas/company-description";
import { appLocaleToWorkspaceLocale } from "@/lib/workspace-locale";
import type { Locale } from "@/lib/locale";
import { prisma } from "@/db/client";
import { assertCanAcceptInvitation, assertCanCreateWorkspace, assertCanInviteMember } from "@/server/permissions/entitlements";
import { PermissionError, WorkspaceError } from "@/server/permissions/errors";
import { filterWorkspaceMembersForUi, getWorkspaceMembership, requireRole } from "@/server/permissions/require-workspace";
import {
  persistActiveWorkspace,
  reconcileStaleActiveWorkspace,
  resolveActiveWorkspace,
} from "@/server/workspaces/active-workspace";

const INVITATION_TTL_DAYS = 7;

export async function getUserWorkspaces(userId: string) {
  return listWorkspacesForUser(userId);
}

export async function getWorkspace(workspaceId: string) {
  return findWorkspaceById(workspaceId);
}

const SLUG_RETRY_ATTEMPTS = 10;

/** Slugs are never reused after archive (global unique). Archived rows keep their slug; new workspaces get suffixes. */
async function resolveAvailableSlug(name: string): Promise<string> {
  const base = normalizeWorkspaceSlug(name);

  if (!isValidWorkspaceSlug(base)) {
    throw new WorkspaceError("Invalid workspace slug.");
  }

  for (let attempt = 0; attempt < SLUG_RETRY_ATTEMPTS; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existingSlug = await prisma.workspace.findUnique({ where: { slug } });

    if (!existingSlug) {
      return slug;
    }
  }

  throw new WorkspaceError("Could not generate a unique workspace slug.");
}

export async function createWorkspace(
  user: User,
  input: {
    name: string;
    slug?: string;
    industry: WorkspaceIndustry;
    industryOtherText?: string;
    appearanceTheme?: WorkspaceAppearanceTheme;
    locale?: Locale;
    branding?: WorkspaceBranding;
    aiInstructions?: string;
    companyDescription?: string | null;
  },
) {
  await assertCanCreateWorkspace(user.id);

  const billingAccount = await ensureBillingAccount(user.id);
  const slug = input.slug
    ? normalizeWorkspaceSlug(input.slug)
    : await resolveAvailableSlug(input.name);

  if (!isValidWorkspaceSlug(slug)) {
    throw new WorkspaceError("Invalid workspace slug.");
  }

  if (input.slug) {
    const existingSlug = await prisma.workspace.findUnique({ where: { slug } });

    if (existingSlug) {
      throw new WorkspaceError("Workspace slug is already taken.");
    }
  }

  const branding = input.branding
    ? workspaceBrandingSchema.parse(input.branding)
    : undefined;
  const companyDescription =
    input.companyDescription === undefined
      ? undefined
      : parseCompanyDescription(input.companyDescription);

  const workspace = await createWorkspaceRecord({
    billingAccountId: billingAccount.id,
    ownerId: user.id,
    name: input.name.trim(),
    slug,
    industry: input.industry,
    industryOtherText: input.industryOtherText,
    defaultLocale: appLocaleToWorkspaceLocale(input.locale ?? "pl"),
    appearanceTheme: input.appearanceTheme,
    branding,
    aiInstructions: input.aiInstructions,
    companyDescription,
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId: workspace.id,
    entityType: "Workspace",
    entityId: workspace.id,
    action: "created",
  });

  return workspace;
}

export async function updateWorkspaceAppearance(
  user: User,
  workspaceId: string,
  appearanceTheme: WorkspaceAppearanceTheme,
) {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    throw new WorkspaceError("Workspace not found.");
  }

  if (workspace.ownerId !== user.id) {
    throw new PermissionError("Only the workspace owner can change appearance.");
  }

  const updated = await updateWorkspaceAppearanceRecord(workspaceId, appearanceTheme);

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "Workspace",
    entityId: workspaceId,
    action: "appearance_updated",
    diff: { appearanceTheme },
  });

  return updated;
}

export async function updateWorkspaceDetails(
  user: User,
  workspaceId: string,
  input: {
    name?: string;
    defaultLocale?: WorkspaceLocale;
  },
) {
  await requireRole(user, workspaceId, "OWNER");

  const data: {
    name?: string;
    defaultLocale?: WorkspaceLocale;
  } = {};

  if (input.name !== undefined) {
    data.name = input.name.trim();
  }

  if (input.defaultLocale !== undefined) {
    data.defaultLocale = input.defaultLocale;
  }

  const workspace = await updateWorkspaceRecord(workspaceId, data);

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "Workspace",
    entityId: workspaceId,
    action: "updated",
    diff: data,
  });

  return workspace;
}

export async function archiveWorkspace(user: User, workspaceId: string) {
  await requireRole(user, workspaceId, "OWNER");

  await revokeAllPendingWorkspaceInvitations(workspaceId);

  const workspace = await softDeleteWorkspaceRecord(workspaceId);

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "Workspace",
    entityId: workspaceId,
    action: "archived",
  });

  await reconcileStaleActiveWorkspace(user.id);

  const remainingAccessibleCount = await countAccessibleWorkspaces(user.id);

  if (remainingAccessibleCount > 0) {
    const nextActiveId = await resolveActiveWorkspace(user.id);

    if (nextActiveId) {
      await persistActiveWorkspace(user.id, nextActiveId);
    }
  }

  return { workspace, remainingAccessibleCount };
}

export async function leaveWorkspace(user: User, workspaceId: string) {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    throw new PermissionError("Workspace not found.");
  }

  if (workspace.ownerId === user.id) {
    throw new PermissionError("Workspace owners cannot leave their workspace.");
  }

  const membership = await getWorkspaceMembership(user.id, workspaceId);

  if (!membership) {
    throw new PermissionError("You are not a member of this workspace.");
  }

  const deletedMembership = await softDeleteWorkspaceMemberMembership(
    user.id,
    workspaceId,
  );

  if (!deletedMembership) {
    throw new PermissionError("You are not a member of this workspace.");
  }

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "WorkspaceMember",
    entityId: deletedMembership.id,
    action: "left",
  });

  await reconcileStaleActiveWorkspace(user.id);

  const remainingAccessibleCount = await countAccessibleWorkspaces(user.id);

  if (remainingAccessibleCount > 0) {
    const nextActiveId = await resolveActiveWorkspace(user.id);

    if (nextActiveId) {
      await persistActiveWorkspace(user.id, nextActiveId);
    }
  }

  return { remainingAccessibleCount };
}

export async function updateWorkspaceSettings(
  user: User,
  workspaceId: string,
  input: {
    branding?: WorkspaceBranding | null;
    aiInstructions?: string | null;
    companyDescription?: string | null;
  },
) {
  await requireRole(user, workspaceId, "OWNER");

  const branding =
    input.branding === undefined
      ? undefined
      : input.branding === null
        ? null
        : workspaceBrandingSchema.parse(input.branding);
  const companyDescription =
    input.companyDescription === undefined
      ? undefined
      : parseCompanyDescription(input.companyDescription);

  const settings = await updateWorkspaceSettingsRecord(workspaceId, {
    branding,
    aiInstructions: input.aiInstructions,
    companyDescription,
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "WorkspaceSettings",
    entityId: settings.id,
    action: "updated",
  });

  return settings;
}

export async function updateWorkspaceProfile(
  user: User,
  workspaceId: string,
  input: {
    name: string;
    appearanceTheme: WorkspaceAppearanceTheme;
    companyDescription?: string | null;
  },
) {
  await requireRole(user, workspaceId, "OWNER");

  const companyDescription = parseCompanyDescription(input.companyDescription);
  const name = input.name.trim();

  const workspace = await prisma.$transaction(async (tx) => {
    const updated = await tx.workspace.update({
      where: { id: workspaceId },
      data: {
        name,
        appearanceTheme: input.appearanceTheme,
      },
      include: { settings: true },
    });

    await tx.workspaceSettings.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        companyDescription: companyDescription ?? undefined,
      },
      update: {
        companyDescription: companyDescription ?? undefined,
      },
    });

    return updated;
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "Workspace",
    entityId: workspaceId,
    action: "profile_updated",
    diff: {
      name,
      appearanceTheme: input.appearanceTheme,
      companyDescription,
    },
  });

  return workspace;
}

export async function getWorkspaceMembersForUi(user: User, workspaceId: string) {
  await requireRole(user, workspaceId, "VIEWER");
  const members = await listWorkspaceMembers(workspaceId);
  return filterWorkspaceMembersForUi(members);
}

export async function createWorkspaceInvitation(
  user: User,
  workspaceId: string,
  input: {
    email: string;
    role: InviteRole;
  },
) {
  await requireRole(user, workspaceId, "OWNER");
  await assertCanInviteMember(workspaceId);

  const email = input.email.trim().toLowerCase();

  const pending = await findPendingInvitation(workspaceId, email);

  if (pending) {
    throw new WorkspaceError("An invitation is already pending for this email.");
  }

  const invitation = await createInvitationRecord({
    workspaceId,
    email,
    role: input.role,
    token: randomUUID(),
    invitedById: user.id,
    expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "WorkspaceInvitation",
    entityId: invitation.id,
    action: "created",
  });

  return invitation;
}

export async function listReceivedInvitationsForUser(user: User) {
  return listReceivedInvitations(user.email);
}

async function acceptPendingInvitation(
  user: User,
  invitation: {
    id: string;
    workspaceId: string;
    email: string;
    role: InviteRole;
    invitedById: string;
    expiresAt: Date;
    status: string;
  },
) {
  if (invitation.status !== "PENDING") {
    throw new WorkspaceError("Invitation not found or no longer valid.");
  }

  if (invitation.expiresAt < new Date()) {
    await revokeInvitationRecord(invitation.id);
    throw new WorkspaceError("Invitation has expired.");
  }

  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new WorkspaceError("Invitation email does not match your account.");
  }

  await assertCanAcceptInvitation(user.id);
  await assertCanInviteMember(invitation.workspaceId);

  const result = await acceptInvitationRecord({
    invitationId: invitation.id,
    workspaceId: invitation.workspaceId,
    userId: user.id,
    role: invitation.role,
    invitedById: invitation.invitedById,
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId: invitation.workspaceId,
    entityType: "WorkspaceInvitation",
    entityId: invitation.id,
    action: "accepted",
  });

  return result;
}

export async function acceptWorkspaceInvitation(user: User, token: string) {
  const invitation = await findInvitationByToken(token);

  if (!invitation) {
    throw new WorkspaceError("Invitation not found or no longer valid.");
  }

  return acceptPendingInvitation(user, invitation);
}

export async function acceptWorkspaceInvitationById(user: User, invitationId: string) {
  const invitation = await findReceivedInvitationById(user.email, invitationId);

  if (!invitation) {
    throw new WorkspaceError("Invitation not found or no longer valid.");
  }

  return acceptPendingInvitation(user, invitation);
}

export async function declineWorkspaceInvitation(user: User, invitationId: string) {
  const invitation = await findReceivedInvitationById(user.email, invitationId);

  if (!invitation) {
    throw new WorkspaceError("Invitation not found or no longer valid.");
  }

  const declined = await prisma.workspaceInvitation.update({
    where: { id: invitationId },
    data: { status: "DECLINED" },
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId: invitation.workspaceId,
    entityType: "WorkspaceInvitation",
    entityId: invitationId,
    action: "declined",
  });

  return declined;
}

export async function dismissInvitationPrompt(user: User, invitationId: string) {
  const invitation = await findReceivedInvitationById(user.email, invitationId);

  if (!invitation) {
    throw new WorkspaceError("Invitation not found or no longer valid.");
  }

  return prisma.workspaceInvitation.update({
    where: { id: invitationId },
    data: { promptDismissedAt: new Date() },
  });
}

export async function revokeWorkspaceInvitation(
  user: User,
  workspaceId: string,
  invitationId: string,
) {
  await requireRole(user, workspaceId, "OWNER");

  const invitation = await prisma.workspaceInvitation.findFirst({
    where: { id: invitationId, workspaceId, status: "PENDING" },
  });

  if (!invitation) {
    throw new WorkspaceError("Invitation not found.");
  }

  const revoked = await revokeInvitationRecord(invitationId);

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "WorkspaceInvitation",
    entityId: invitationId,
    action: "revoked",
  });

  return revoked;
}

export async function listWorkspaceRules(user: User, workspaceId: string) {
  await requireRole(user, workspaceId, "VIEWER");

  return prisma.workspaceRule.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createWorkspaceRule(
  user: User,
  workspaceId: string,
  input: {
    type: WorkspaceRuleType;
    locale?: WorkspaceLocale | null;
    title: string;
    content: string;
    sortOrder?: number;
  },
) {
  await requireRole(user, workspaceId, "OWNER");

  const rule = await createWorkspaceRuleRecord({
    workspaceId,
    ...input,
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "WorkspaceRule",
    entityId: rule.id,
    action: "created",
  });

  return rule;
}

export async function updateWorkspaceRule(
  user: User,
  workspaceId: string,
  ruleId: string,
  input: {
    type?: WorkspaceRuleType;
    locale?: WorkspaceLocale | null;
    title?: string;
    content?: string;
    sortOrder?: number;
    active?: boolean;
  },
) {
  await requireRole(user, workspaceId, "OWNER");

  const existing = await prisma.workspaceRule.findFirst({
    where: { id: ruleId, workspaceId, deletedAt: null },
  });

  if (!existing) {
    throw new WorkspaceError("Rule not found.");
  }

  const rule = await updateWorkspaceRuleRecord(ruleId, input);

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "WorkspaceRule",
    entityId: ruleId,
    action: "updated",
    diff: input,
  });

  return rule;
}

export async function deleteWorkspaceRule(
  user: User,
  workspaceId: string,
  ruleId: string,
) {
  await requireRole(user, workspaceId, "OWNER");

  const existing = await prisma.workspaceRule.findFirst({
    where: { id: ruleId, workspaceId, deletedAt: null },
  });

  if (!existing) {
    throw new WorkspaceError("Rule not found.");
  }

  const rule = await softDeleteWorkspaceRuleRecord(ruleId);

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "WorkspaceRule",
    entityId: ruleId,
    action: "deleted",
  });

  return rule;
}

export async function getWorkspacePromptContext(
  workspaceId: string,
  locale?: WorkspaceLocale,
) {
  const [settings, rules] = await Promise.all([
    findWorkspaceSettings(workspaceId),
    listActiveWorkspaceRules(workspaceId, locale),
  ]);

  return buildWorkspacePromptContext({
    companyDescription: settings?.companyDescription,
    rules,
  });
}
