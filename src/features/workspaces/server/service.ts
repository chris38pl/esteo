import type {
  InviteRole,
  SubscriptionPlan,
  User,
  WorkspaceAppearanceTheme,
  WorkspaceIndustry,
  WorkspaceLocale,
  WorkspaceRuleType,
} from "@prisma/client";
import { randomUUID } from "crypto";

import { defaultPlanVersion } from "@/server/billing/plan-catalog";
import { isUniqueConstraintError } from "@/lib/database/is-unique-constraint-error";
import { countAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import { isValidWorkspaceSlug, normalizeWorkspaceSlug } from "@/features/workspaces/lib/slug";
import { isServiceWorkspace } from "@/features/workspaces/lib/industries";
import { isSlugAvailable, recordSlugAlias } from "@/features/workspaces/server/slug-availability";
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
import { cleanupWorkspaceLogoStorage } from "@/features/workspaces/server/logo-service";
import { parseCompanyDescription } from "@/features/workspaces/schemas/company-description";
import { parseCompanyProfileFields } from "@/features/workspaces/schemas/company-profile";
import { loadEstimateGenerationContext } from "@/features/workspaces/lib/load-estimate-generation-context";
import { buildWorkspacePromptContext } from "@/features/workspaces/lib/prompt-context";
import { workspaceLocaleToAppLocale } from "@/lib/workspace-locale";
import {
  WORKSPACE_ESTIMATE_RULES_MAX_COUNT,
  WORKSPACE_GENERAL_RULES_MAX_LENGTH,
  WORKSPACE_RULE_MAX_LENGTH,
} from "@/features/workspaces/lib/workspace-rules-limits";
import { appLocaleToWorkspaceLocale } from "@/lib/workspace-locale";
import type { Locale } from "@/lib/locale";
import { prisma } from "@/db/client";
import {
  assertCanCreateFreeWorkspace,
  assertCanInviteMember,
} from "@/server/permissions/entitlements";
import { EntitlementError, PermissionError, WorkspaceError } from "@/server/permissions/errors";
import { filterWorkspaceMembersForUi, getWorkspaceMembership, requireRole } from "@/server/permissions/require-workspace";
import {
  persistActiveWorkspace,
  reconcileStaleActiveWorkspace,
  resolveActiveWorkspace,
} from "@/server/workspaces/active-workspace";
import {
  notifyInvitationAccepted,
  notifyInvitationDeclined,
  notifyInvitationReceived,
  notifyInvitationRevoked,
} from "@/features/notifications/server/notification-emit-helpers";
import {
  fireNotification,
  loadWorkspaceNotificationContext,
} from "@/features/notifications/server/notification-workspace-context";

const INVITATION_TTL_DAYS = 7;

export async function getUserWorkspaces(userId: string) {
  return listWorkspacesForUser(userId);
}

export async function getWorkspace(workspaceId: string) {
  return findWorkspaceById(workspaceId);
}

const SLUG_RETRY_ATTEMPTS = 10;

/**
 * Finds a unique slug derived from name. Checks both Workspace.slug and WorkspaceSlugAlias.slug
 * so generated slugs never collide with existing aliases either.
 */
async function resolveAvailableSlug(name: string): Promise<string> {
  const base = normalizeWorkspaceSlug(name);

  if (!isValidWorkspaceSlug(base)) {
    throw new WorkspaceError("Invalid workspace slug.");
  }

  for (let attempt = 0; attempt < SLUG_RETRY_ATTEMPTS; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;

    if (await isSlugAvailable(slug)) {
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
    plan?: SubscriptionPlan;
    industry: WorkspaceIndustry;
    industryOtherText?: string;
    appearanceTheme?: WorkspaceAppearanceTheme;
    locale?: Locale;
    branding?: WorkspaceBranding;
    aiInstructions?: string;
    companyDescription?: string | null;
  },
) {
  const plan: SubscriptionPlan = input.plan ?? "FREE";

  if (plan === "FREE") {
    await prisma.$transaction(async (tx) => {
      const { lockOwner } = await import("@/server/billing/workspace-billing-maintenance");
      await lockOwner(tx, user.id);
      await assertCanCreateFreeWorkspace(user.id, tx);
    });
  }

  const slug = input.slug
    ? normalizeWorkspaceSlug(input.slug)
    : await resolveAvailableSlug(input.name);

  if (!isValidWorkspaceSlug(slug)) {
    throw new WorkspaceError("Invalid workspace slug.");
  }

  if (input.slug) {
    if (!(await isSlugAvailable(slug))) {
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

  // Per-workspace billing: create the 1:1 BillingAccount first (workspaceId linked after the
  // workspace exists, since the FK is bidirectional and the workspace id is generated on create).
  const billingAccount = await prisma.billingAccount.create({
    data: { ownerUserId: user.id, payerUserId: user.id },
  });

  let workspace;
  try {
    workspace = await createWorkspaceRecord({
      billingAccountId: billingAccount.id,
      ownerId: user.id,
      name: input.name.trim(),
      slug,
      slugIsCustom: Boolean(input.slug),
      industry: input.industry,
      industryOtherText: input.industryOtherText,
      defaultLocale: appLocaleToWorkspaceLocale(input.locale ?? "pl"),
      appearanceTheme: input.appearanceTheme,
      branding,
      aiInstructions: input.aiInstructions,
      companyDescription,
      isActiveFree: plan === "FREE",
      // Paid workspaces are provisioned INCOMPLETE and activated by the checkout webhook.
      provisioningStatus: plan === "FREE" ? "ACTIVE" : "INCOMPLETE",
    });
  } catch (error) {
    // Clean up the orphaned billing account before surfacing the error.
    await prisma.billingAccount.delete({ where: { id: billingAccount.id } }).catch(() => {});

    if (plan === "FREE" && isUniqueConstraintError(error)) {
      throw new EntitlementError(
        "You already have an active free workspace. Upgrade or remove it to create another.",
        "FREE_SLOT_ACTIVE",
      );
    }
    throw error;
  }

  // Link the billing account to the workspace and provision the subscription.
  await prisma.billingAccount.update({
    where: { id: billingAccount.id },
    data: {
      workspaceId: workspace.id,
      subscription: {
        create: {
          plan,
          planVersion: defaultPlanVersion(plan),
          // FREE is immediately usable; paid plans stay INACTIVE until checkout completes.
          status: plan === "FREE" ? "ACTIVE" : "INACTIVE",
        },
      },
    },
  });

  const { syncWorkspaceStorageLimitFromPlan } = await import(
    "@/server/billing/workspace-plan-sync"
  );
  await syncWorkspaceStorageLimitFromPlan(workspace.id);

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
    slug?: string;
    defaultLocale?: WorkspaceLocale;
  },
) {
  await requireRole(user, workspaceId, "OWNER");

  const existing = await findWorkspaceById(workspaceId);
  if (!existing) {
    throw new WorkspaceError("Workspace not found.");
  }

  const data: {
    name?: string;
    slug?: string;
    slugIsCustom?: boolean;
    defaultLocale?: WorkspaceLocale;
  } = {};

  if (input.name !== undefined) {
    data.name = input.name.trim();
  }

  if (input.defaultLocale !== undefined) {
    data.defaultLocale = input.defaultLocale;
  }

  if (input.slug !== undefined) {
    const slug = normalizeWorkspaceSlug(input.slug);
    if (!isValidWorkspaceSlug(slug)) {
      throw new WorkspaceError("Invalid workspace slug.");
    }
    if (!(await isSlugAvailable(slug, workspaceId))) {
      throw new WorkspaceError("Workspace slug is already taken.");
    }
    if (slug !== existing.slug) {
      await recordSlugAlias(workspaceId, existing.slug);
      data.slug = slug;
      data.slugIsCustom = true;
    }
  } else if (input.name !== undefined && !existing.slugIsCustom) {
    const nextSlug = await resolveAvailableSlug(data.name!);
    if (nextSlug !== existing.slug) {
      await recordSlugAlias(workspaceId, existing.slug);
      data.slug = nextSlug;
    }
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

  const { loadLiveSubscriptionForTransfer } = await import(
    "@/features/workspaces/server/transfer-eligibility"
  );
  const { getPendingWorkspaceTransfer } = await import(
    "@/features/workspaces/server/ownership-transfer"
  );
  const { evaluateWorkspaceDeleteEligibility } = await import(
    "@/features/workspaces/lib/workspace-delete-eligibility"
  );

  const [subscription, pendingTransfer, billingOwnershipState] = await Promise.all([
    loadLiveSubscriptionForTransfer(workspaceId),
    getPendingWorkspaceTransfer(workspaceId),
    import("@/features/billing/server/billing-permissions").then((m) =>
      m.getWorkspaceBillingOwnershipState(workspaceId),
    ),
  ]);

  const deleteEligibility = evaluateWorkspaceDeleteEligibility({
    subscription,
    hasPendingTransfer: Boolean(pendingTransfer),
    billingOwnershipState: billingOwnershipState ?? "NORMAL",
  });

  if (!deleteEligibility.allowed) {
    if (deleteEligibility.blockReason === "PENDING_TRANSFER_EXISTS") {
      throw new WorkspaceError(
        "Cancel the pending ownership transfer before deleting this workspace.",
      );
    }
    if (deleteEligibility.blockReason === "BILLING_HANDOFF_ACTIVE") {
      throw new WorkspaceError(
        "Cannot delete this workspace while billing handoff is active.",
      );
    }
    if (deleteEligibility.blockReason === "CANCEL_SUBSCRIPTION_REQUIRED") {
      throw new WorkspaceError(
        "Cancel the current subscription before deleting this workspace.",
      );
    }
  }

  await revokeAllPendingWorkspaceInvitations(workspaceId);

  await cleanupWorkspaceLogoStorage(workspaceId);

  const workspace = await softDeleteWorkspaceRecord(workspaceId);

  const { recomputeIsActiveFree } = await import(
    "@/server/billing/workspace-billing-maintenance"
  );
  await recomputeIsActiveFree(workspaceId);

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

export async function removeWorkspaceMember(
  actor: User,
  workspaceId: string,
  targetUserId: string,
) {
  await requireRole(actor, workspaceId, "OWNER");

  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    throw new PermissionError("Workspace not found.");
  }

  if (workspace.ownerId === targetUserId) {
    throw new PermissionError("The workspace owner cannot be removed.");
  }

  if (actor.id === targetUserId) {
    throw new PermissionError("You cannot remove yourself from the workspace.");
  }

  const deletedMembership = await softDeleteWorkspaceMemberMembership(
    targetUserId,
    workspaceId,
  );

  if (!deletedMembership) {
    throw new PermissionError("This user is not a member of the workspace.");
  }

  await logAuditEvent({
    actorUserId: actor.id,
    workspaceId,
    entityType: "WorkspaceMember",
    entityId: deletedMembership.id,
    action: "removed",
    diff: { removedUserId: targetUserId },
  });

  await reconcileStaleActiveWorkspace(targetUserId);

  const remainingAccessibleCount = await countAccessibleWorkspaces(targetUserId);

  if (remainingAccessibleCount > 0) {
    const nextActiveId = await resolveActiveWorkspace(targetUserId);

    if (nextActiveId) {
      await persistActiveWorkspace(targetUserId, nextActiveId);
    }
  }

  return deletedMembership;
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

  if (
    input.aiInstructions !== undefined &&
    input.aiInstructions !== null &&
    input.aiInstructions.length > WORKSPACE_GENERAL_RULES_MAX_LENGTH
  ) {
    throw new WorkspaceError("GENERAL_RULES_LIMIT");
  }

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

export async function updateWorkspaceCompanyProfile(
  user: User,
  workspaceId: string,
  input: {
    companyAddress?: string | null;
    companyTaxId?: string | null;
    companyEmail?: string | null;
    companyPhone?: string | null;
  },
) {
  await requireRole(user, workspaceId, "OWNER");

  const parsed = parseCompanyProfileFields(input);

  const settings = await updateWorkspaceSettingsRecord(workspaceId, {
    companyAddress: parsed.companyAddress,
    companyTaxId: parsed.companyTaxId,
    companyEmail: parsed.companyEmail,
    companyPhone: parsed.companyPhone,
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "WorkspaceSettings",
    entityId: settings.id,
    action: "company_profile_updated",
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

export async function updateWorkspaceBusinessType(
  user: User,
  workspaceId: string,
  input: { industryOtherText: string },
) {
  await requireRole(user, workspaceId, "OWNER");

  const existing = await findWorkspaceById(workspaceId);
  if (!existing) {
    throw new WorkspaceError("Workspace not found.");
  }

  if (!isServiceWorkspace(existing.industry)) {
    throw new WorkspaceError("Business type applies only to service workspaces.");
  }

  const industryOtherText = input.industryOtherText.trim();

  const workspace = await updateWorkspaceRecord(workspaceId, {
    industryOtherText,
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "Workspace",
    entityId: workspaceId,
    action: "business_type_updated",
    diff: { industryOtherText },
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

  const workspaceCtx = await loadWorkspaceNotificationContext(workspaceId);
  if (workspaceCtx) {
    fireNotification(
      notifyInvitationReceived({
        locale: workspaceCtx.locale,
        invitationId: invitation.id,
        invitationToken: invitation.token,
        inviteeEmail: email,
        workspaceName: workspaceCtx.workspaceName,
      }),
    );
  }

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

  // Invitee-side billing gating removed: the owner's workspace pays for seats. The single gate is
  // workspace seat availability, re-checked here at accept-time to close the invite/accept race.
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

  const workspaceCtx = await loadWorkspaceNotificationContext(invitation.workspaceId);
  if (workspaceCtx) {
    fireNotification(
      notifyInvitationAccepted({
        ...workspaceCtx,
        invitationId: invitation.id,
      }),
    );
  }

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

  const workspaceCtx = await loadWorkspaceNotificationContext(invitation.workspaceId);
  if (workspaceCtx) {
    fireNotification(
      notifyInvitationDeclined({
        ...workspaceCtx,
        invitationId,
      }),
    );
  }

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

export async function dismissTransferPrompt(user: User, transferId: string) {
  const { findReceivedOwnershipTransferById } = await import(
    "@/features/workspaces/server/transfer-inbox"
  );
  const transfer = await findReceivedOwnershipTransferById(user.email, transferId);

  if (!transfer) {
    throw new WorkspaceError("Transfer not found or no longer valid.");
  }

  return prisma.workspaceOwnershipTransfer.update({
    where: { id: transferId },
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

  const workspaceCtx = await loadWorkspaceNotificationContext(workspaceId);
  if (workspaceCtx) {
    fireNotification(
      notifyInvitationRevoked({
        locale: workspaceCtx.locale,
        invitationId,
        inviteeEmail: invitation.email,
        workspaceName: workspaceCtx.workspaceName,
      }),
    );
  }

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

  if (input.type === "ESTIMATE") {
    const existingEstimateRules = await prisma.workspaceRule.count({
      where: { workspaceId, type: "ESTIMATE", deletedAt: null },
    });

    if (existingEstimateRules >= WORKSPACE_ESTIMATE_RULES_MAX_COUNT) {
      throw new WorkspaceError("RULE_LIMIT_REACHED");
    }

    if (input.content.length > WORKSPACE_RULE_MAX_LENGTH) {
      throw new WorkspaceError("RULE_CHAR_LIMIT");
    }
  }

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

  if (input.content !== undefined && existing.type === "ESTIMATE") {
    if (input.content.length > WORKSPACE_RULE_MAX_LENGTH) {
      throw new WorkspaceError("RULE_CHAR_LIMIT");
    }
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
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    return "";
  }

  const appLocale = locale
    ? workspaceLocaleToAppLocale(locale)
    : workspaceLocaleToAppLocale(workspace.defaultLocale);

  const context = await loadEstimateGenerationContext(workspaceId, appLocale);

  if (!context) {
    return "";
  }

  return buildWorkspacePromptContext({
    companyDescription: context.companyDescription,
    aiInstructions: context.aiInstructions,
    estimateSections: context.estimateSections,
    rules: context.rules,
  });
}
