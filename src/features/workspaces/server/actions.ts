"use server";

import type { InviteRole, WorkspaceAppearanceTheme, WorkspaceIndustry, WorkspaceLocale, WorkspaceRuleType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  type WorkspaceBranding,
  workspaceBrandingSchema,
} from "@/features/workspaces/schemas/branding";
import {
  type WorkspaceEstimateSection,
  workspaceEstimateSectionsSchema,
} from "@/features/workspaces/schemas/estimate-sections";
import { findWorkspaceSettings } from "@/features/workspaces/server/repository";
import { updateWorkspaceProfileSchema } from "@/features/workspaces/schemas/update-workspace-profile";
import {
  acceptWorkspaceInvitation,
  acceptWorkspaceInvitationById,
  archiveWorkspace,
  createWorkspace,
  createWorkspaceInvitation,
  createWorkspaceRule,
  declineWorkspaceInvitation,
  deleteWorkspaceRule,
  dismissInvitationPrompt,
  getUserWorkspaces,
  getWorkspace,
  getWorkspaceMembersForUi,
  leaveWorkspace,
  listReceivedInvitationsForUser,
  listWorkspaceRules,
  revokeWorkspaceInvitation,
  updateWorkspaceDetails,
  updateWorkspaceProfile,
  updateWorkspaceRule,
  updateWorkspaceSettings,
} from "@/features/workspaces/server/service";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { hasPendingInvitations } from "@/features/workspaces/server/invitation-inbox";
import {
  EntitlementError,
  PermissionError,
  WorkspaceError,
} from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";
import { persistActiveWorkspace } from "@/server/workspaces/active-workspace";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof EntitlementError) {
    return { success: false, error: error.message, code: error.code };
  }

  if (
    error instanceof PermissionError ||
    error instanceof WorkspaceError
  ) {
    return { success: false, error: error.message };
  }

  console.error(error);
  return { success: false, error: "Something went wrong." };
}

export async function listMyWorkspacesAction(locale: Locale = "pl") {
  try {
    const user = await requireAuth(locale);
    const workspaces = await getUserWorkspaces(user.id);
    return { success: true as const, data: workspaces };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getWorkspaceAction(
  workspaceId: string,
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const workspace = await getWorkspace(workspaceId);

    if (!workspace) {
      return { success: false as const, error: "Workspace not found." };
    }

    await requireRole(user, workspaceId, "VIEWER");
    return { success: true as const, data: workspace };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createWorkspaceAction(
  input: {
    name: string;
    slug?: string;
    industry: WorkspaceIndustry;
    industryOtherText?: string;
    locale?: Locale;
    branding?: WorkspaceBranding;
    aiInstructions?: string;
    companyDescription?: string | null;
  },
  locale: Locale = "pl",
): Promise<ActionResult<Awaited<ReturnType<typeof createWorkspace>>>> {
  try {
    const user = await requireAuth(locale);
    const workspace = await createWorkspace(user, input);
    revalidatePath(`/${locale}/dashboard`);
    return { success: true, data: workspace };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateWorkspaceAction(
  workspaceId: string,
  input: {
    name?: string;
    defaultLocale?: WorkspaceLocale;
  },
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const workspace = await updateWorkspaceDetails(user, workspaceId, input);
    revalidatePath(`/${locale}/dashboard`);
    return { success: true as const, data: workspace };
  } catch (error) {
    return toActionError(error);
  }
}

export async function archiveWorkspaceAction(
  workspaceId: string,
  locale: Locale = "pl",
):
  | { success: true; redirectTo: string | null }
  | { success: false; error: string; code?: string } {
  try {
    const user = await requireAuth(locale);
    const { remainingAccessibleCount } = await archiveWorkspace(user, workspaceId);

    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/dashboard/workspaces/settings`);
    revalidatePath(`/${locale}/dashboard/invitations`);
    revalidatePath(`/${locale}/dashboard/account`);

    let redirectTo: string | null = null;

    if (remainingAccessibleCount === 0) {
      const pending = await hasPendingInvitations(user.email);
      redirectTo = pending
        ? `/${locale}/dashboard/invitations`
        : `/${locale}/dashboard/onboarding`;
    }

    return { success: true, redirectTo };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateWorkspaceSettingsAction(
  workspaceId: string,
  input: {
    branding?: WorkspaceBranding | null;
    aiInstructions?: string | null;
    companyDescription?: string | null;
  },
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const settings = await updateWorkspaceSettings(user, workspaceId, input);
    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/dashboard/workspaces/settings`);
    return { success: true as const, data: settings };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateWorkspaceEstimateSectionsAction(
  workspaceId: string,
  sections: WorkspaceEstimateSection[],
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const parsedSections = workspaceEstimateSectionsSchema.parse(sections);

    const existingSettings = await findWorkspaceSettings(workspaceId);
    const brandingResult = workspaceBrandingSchema.safeParse(
      existingSettings?.branding ?? {},
    );
    const currentBranding = brandingResult.success ? brandingResult.data : {};

    const mergedBranding = workspaceBrandingSchema.parse({
      ...currentBranding,
      estimateSections: parsedSections,
    });

    const settings = await updateWorkspaceSettings(user, workspaceId, {
      branding: mergedBranding,
    });

    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/dashboard/workspaces/settings`);

    return { success: true as const, data: settings };
  } catch (error) {
    return toActionError(error);
  }
}

export async function resetWorkspaceEstimateSectionsAction(
  workspaceId: string,
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);

    const existingSettings = await findWorkspaceSettings(workspaceId);
    const brandingResult = workspaceBrandingSchema.safeParse(
      existingSettings?.branding ?? {},
    );
    const currentBranding = brandingResult.success ? brandingResult.data : {};

    const { estimateSections: _removed, ...brandingWithoutSections } = currentBranding;

    const mergedBranding = workspaceBrandingSchema.parse(brandingWithoutSections);

    const settings = await updateWorkspaceSettings(user, workspaceId, {
      branding: mergedBranding,
    });

    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/dashboard/workspaces/settings`);

    return { success: true as const, data: settings };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateWorkspaceProfileAction(
  workspaceId: string,
  input: {
    name: string;
    appearanceTheme: WorkspaceAppearanceTheme;
    companyDescription?: string | null;
  },
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const parsed = updateWorkspaceProfileSchema.parse(input);
    const workspace = await updateWorkspaceProfile(user, workspaceId, parsed);
    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/dashboard/workspaces/settings`);
    return { success: true as const, data: workspace };
  } catch (error) {
    return toActionError(error);
  }
}

export async function listWorkspaceMembersAction(
  workspaceId: string,
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const members = await getWorkspaceMembersForUi(user, workspaceId);
    return { success: true as const, data: members };
  } catch (error) {
    return toActionError(error);
  }
}

export async function inviteWorkspaceMemberAction(
  workspaceId: string,
  input: { email: string; role: InviteRole },
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const invitation = await createWorkspaceInvitation(user, workspaceId, input);
    return { success: true as const, data: invitation };
  } catch (error) {
    return toActionError(error);
  }
}

export async function acceptWorkspaceInvitationAction(
  token: string,
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const invitation = await acceptWorkspaceInvitation(user, token);
    await persistActiveWorkspace(user.id, invitation.workspaceId);
    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/dashboard/invitations`);
    revalidatePath(`/${locale}/dashboard/account`);
    return { success: true as const, data: invitation };
  } catch (error) {
    return toActionError(error);
  }
}

export async function listReceivedInvitationsAction(locale: Locale = "pl") {
  try {
    const user = await requireAuth(locale);
    const invitations = await listReceivedInvitationsForUser(user);
    return { success: true as const, data: invitations };
  } catch (error) {
    return toActionError(error);
  }
}

export async function acceptReceivedInvitationAction(
  invitationId: string,
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const invitation = await acceptWorkspaceInvitationById(user, invitationId);
    await persistActiveWorkspace(user.id, invitation.workspaceId);
    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/dashboard/invitations`);
    revalidatePath(`/${locale}/dashboard/account`);
    return { success: true as const, data: invitation };
  } catch (error) {
    return toActionError(error);
  }
}

export async function declineReceivedInvitationAction(
  invitationId: string,
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const invitation = await declineWorkspaceInvitation(user, invitationId);
    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/dashboard/invitations`);
    revalidatePath(`/${locale}/dashboard/account`);
    return { success: true as const, data: invitation };
  } catch (error) {
    return toActionError(error);
  }
}

export async function dismissInvitationPromptAction(
  invitationId: string,
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const invitation = await dismissInvitationPrompt(user, invitationId);
    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/dashboard/account`);
    return { success: true as const, data: invitation };
  } catch (error) {
    return toActionError(error);
  }
}

export async function revokeWorkspaceInvitationAction(
  workspaceId: string,
  invitationId: string,
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const invitation = await revokeWorkspaceInvitation(
      user,
      workspaceId,
      invitationId,
    );
    return { success: true as const, data: invitation };
  } catch (error) {
    return toActionError(error);
  }
}

export async function listWorkspaceRulesAction(
  workspaceId: string,
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const rules = await listWorkspaceRules(user, workspaceId);
    return { success: true as const, data: rules };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createWorkspaceRuleAction(
  workspaceId: string,
  input: {
    type: WorkspaceRuleType;
    locale?: WorkspaceLocale | null;
    title: string;
    content: string;
    sortOrder?: number;
  },
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const rule = await createWorkspaceRule(user, workspaceId, input);
    return { success: true as const, data: rule };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateWorkspaceRuleAction(
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
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const rule = await updateWorkspaceRule(user, workspaceId, ruleId, input);
    return { success: true as const, data: rule };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteWorkspaceRuleAction(
  workspaceId: string,
  ruleId: string,
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const rule = await deleteWorkspaceRule(user, workspaceId, ruleId);
    return { success: true as const, data: rule };
  } catch (error) {
    return toActionError(error);
  }
}

export async function leaveWorkspaceAction(
  workspaceId: string,
  locale: Locale = "pl",
):
  | { success: true; redirectTo: string | null }
  | { success: false; error: string; code?: string } {
  try {
    const user = await requireAuth(locale);
    const { remainingAccessibleCount } = await leaveWorkspace(user, workspaceId);

    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/dashboard/workspaces/settings`);

    let redirectTo: string | null = null;

    if (remainingAccessibleCount === 0) {
      const pending = await hasPendingInvitations(user.email);
      redirectTo = pending
        ? `/${locale}/dashboard/invitations`
        : `/${locale}/dashboard/onboarding`;
    }

    return { success: true, redirectTo };
  } catch (error) {
    return toActionError(error);
  }
}
