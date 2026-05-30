"use server";

import type { InviteRole, WorkspaceIndustry, WorkspaceLocale, WorkspaceRuleType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import {
  acceptWorkspaceInvitation,
  archiveWorkspace,
  createWorkspace,
  createWorkspaceInvitation,
  createWorkspaceRule,
  deleteWorkspaceRule,
  getUserWorkspaces,
  getWorkspace,
  getWorkspaceMembersForUi,
  listWorkspaceRules,
  revokeWorkspaceInvitation,
  updateWorkspaceDetails,
  updateWorkspaceRule,
  updateWorkspaceSettings,
} from "@/features/workspaces/server/service";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import {
  EntitlementError,
  PermissionError,
  WorkspaceError,
} from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (
    error instanceof PermissionError ||
    error instanceof EntitlementError ||
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
) {
  try {
    const user = await requireAuth(locale);
    const workspace = await archiveWorkspace(user, workspaceId);
    revalidatePath(`/${locale}/dashboard`);
    return { success: true as const, data: workspace };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateWorkspaceSettingsAction(
  workspaceId: string,
  input: {
    branding?: WorkspaceBranding | null;
    aiInstructions?: string | null;
  },
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const settings = await updateWorkspaceSettings(user, workspaceId, input);
    revalidatePath(`/${locale}/dashboard`);
    return { success: true as const, data: settings };
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
    revalidatePath(`/${locale}/dashboard`);
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
