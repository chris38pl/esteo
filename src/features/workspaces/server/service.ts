import type { InviteRole, User, WorkspaceLocale, WorkspaceRuleType } from "@prisma/client";
import { randomUUID } from "crypto";

import { ensureBillingAccount } from "@/features/billing/server/provision-billing-account";
import { isValidWorkspaceSlug, normalizeWorkspaceSlug } from "@/features/workspaces/lib/slug";
import {
  acceptInvitationRecord,
  buildWorkspacePromptFromRules,
  createInvitationRecord,
  createWorkspaceRecord,
  createWorkspaceRuleRecord,
  findInvitationByToken,
  findPendingInvitation,
  findWorkspaceById,
  listActiveWorkspaceRules,
  listWorkspacesForUser,
  listWorkspaceMembers,
  logAuditEvent,
  revokeInvitationRecord,
  softDeleteWorkspaceRecord,
  softDeleteWorkspaceRuleRecord,
  updateWorkspaceRecord,
  updateWorkspaceRuleRecord,
  updateWorkspaceSettingsRecord,
} from "@/features/workspaces/server/repository";
import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import { appLocaleToWorkspaceLocale } from "@/lib/workspace-locale";
import type { Locale } from "@/lib/locale";
import { prisma } from "@/db/client";
import { assertCanCreateWorkspace, assertCanInviteMember } from "@/server/permissions/entitlements";
import { WorkspaceError } from "@/server/permissions/errors";
import { filterWorkspaceMembersForUi, requireRole } from "@/server/permissions/require-workspace";

const INVITATION_TTL_DAYS = 7;

export async function getUserWorkspaces(userId: string) {
  return listWorkspacesForUser(userId);
}

export async function getWorkspace(workspaceId: string) {
  return findWorkspaceById(workspaceId);
}

const SLUG_RETRY_ATTEMPTS = 10;

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
    industry?: string;
    locale?: Locale;
    branding?: WorkspaceBranding;
    aiInstructions?: string;
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

  const workspace = await createWorkspaceRecord({
    billingAccountId: billingAccount.id,
    ownerId: user.id,
    name: input.name.trim(),
    slug,
    industry: input.industry,
    defaultLocale: appLocaleToWorkspaceLocale(input.locale ?? "pl"),
    branding,
    aiInstructions: input.aiInstructions,
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

export async function updateWorkspaceDetails(
  user: User,
  workspaceId: string,
  input: {
    name?: string;
    industry?: string | null;
    defaultLocale?: WorkspaceLocale;
  },
) {
  await requireRole(user, workspaceId, "OWNER");

  const data: {
    name?: string;
    industry?: string | null;
    defaultLocale?: WorkspaceLocale;
  } = {};

  if (input.name !== undefined) {
    data.name = input.name.trim();
  }

  if (input.industry !== undefined) {
    data.industry = input.industry;
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

  const workspace = await softDeleteWorkspaceRecord(workspaceId);

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "Workspace",
    entityId: workspaceId,
    action: "archived",
  });

  return workspace;
}

export async function updateWorkspaceSettings(
  user: User,
  workspaceId: string,
  input: {
    branding?: WorkspaceBranding | null;
    aiInstructions?: string | null;
  },
) {
  await requireRole(user, workspaceId, "OWNER");

  const branding =
    input.branding === undefined
      ? undefined
      : input.branding === null
        ? null
        : workspaceBrandingSchema.parse(input.branding);

  const settings = await updateWorkspaceSettingsRecord(workspaceId, {
    branding,
    aiInstructions: input.aiInstructions,
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

export async function acceptWorkspaceInvitation(user: User, token: string) {
  const invitation = await findInvitationByToken(token);

  if (!invitation || invitation.status !== "PENDING") {
    throw new WorkspaceError("Invitation not found or no longer valid.");
  }

  if (invitation.expiresAt < new Date()) {
    await revokeInvitationRecord(invitation.id);
    throw new WorkspaceError("Invitation has expired.");
  }

  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new WorkspaceError("Invitation email does not match your account.");
  }

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
  const rules = await listActiveWorkspaceRules(workspaceId, locale);
  return buildWorkspacePromptFromRules(rules);
}
