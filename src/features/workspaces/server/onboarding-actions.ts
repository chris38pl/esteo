"use server";

import type { WorkspaceAppearanceTheme, WorkspaceIndustry } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { createWorkspace } from "@/features/workspaces/server/service";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { persistActiveWorkspace } from "@/server/workspaces/active-workspace";
import {
  EntitlementError,
  PermissionError,
  WorkspaceError,
} from "@/server/permissions/errors";

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

export async function createWorkspaceOnboardingAction(
  input: {
    name: string;
    industry: WorkspaceIndustry;
    industryOtherText?: string;
    appearanceTheme?: WorkspaceAppearanceTheme;
    companyDescription?: string | null;
  },
  locale: Locale = "pl",
): Promise<ActionResult<Awaited<ReturnType<typeof createWorkspace>>>> {
  return createWorkspaceAndActivate(input, locale, "onboarding");
}

export async function createAdditionalWorkspaceAction(
  input: {
    name: string;
    industry: WorkspaceIndustry;
    industryOtherText?: string;
    appearanceTheme?: WorkspaceAppearanceTheme;
    companyDescription?: string | null;
  },
  locale: Locale = "pl",
): Promise<ActionResult<Awaited<ReturnType<typeof createWorkspace>>>> {
  return createWorkspaceAndActivate(input, locale, "additional");
}

async function createWorkspaceAndActivate(
  input: {
    name: string;
    industry: WorkspaceIndustry;
    industryOtherText?: string;
    appearanceTheme?: WorkspaceAppearanceTheme;
    companyDescription?: string | null;
  },
  locale: Locale,
  flow: "onboarding" | "additional",
): Promise<ActionResult<Awaited<ReturnType<typeof createWorkspace>>>> {
  try {
    const user = await requireAuth(locale);

    if (flow === "additional") {
      const { countOwnedWorkspaces, canUserCreateWorkspace } = await import(
        "@/server/permissions/entitlements"
      );
      const [canCreate, ownedCount] = await Promise.all([
        canUserCreateWorkspace(user.id),
        countOwnedWorkspaces(user.id),
      ]);

      if (!canCreate || ownedCount === 0) {
        throw new EntitlementError("Workspace limit reached for your plan.");
      }
    }

    const workspace = await createWorkspace(user, {
      name: input.name,
      industry: input.industry,
      industryOtherText: input.industryOtherText,
      appearanceTheme: input.appearanceTheme,
      companyDescription: input.companyDescription,
      locale,
    });

    await persistActiveWorkspace(user.id, workspace.id);

    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/dashboard/${workspace.slug}`);
    revalidatePath(`/${locale}/dashboard/onboarding`);
    revalidatePath(`/${locale}/dashboard/workspaces/new`);

    return { success: true, data: workspace };
  } catch (error) {
    return toActionError(error);
  }
}
