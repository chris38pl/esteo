"use server";

import type {
  SubscriptionPlan,
  WorkspaceAppearanceTheme,
  WorkspaceIndustry,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { changeWorkspaceSubscriptionPlan } from "@/features/billing/server/billing-service";
import { processReferralCookieForWorkspace } from "@/features/referrals/server/referral-actions";
import { createWorkspace } from "@/features/workspaces/server/service";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { persistActiveWorkspace } from "@/server/workspaces/active-workspace";
import {
  EntitlementError,
  PermissionError,
  WorkspaceError,
} from "@/server/permissions/errors";
import {
  logMutationActionFailure,
  mapDatabaseUnavailableActionError,
} from "@/server/db/mutation-action-errors";

type CreateWorkspaceResult = {
  workspace: Awaited<ReturnType<typeof createWorkspace>>;
  /** When set, the workspace is INCOMPLETE and the client must redirect to Stripe checkout. */
  checkoutUrl: string | null;
};

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

async function toActionError(
  error: unknown,
  locale: Locale,
): Promise<ActionResult<never>> {
  if (error instanceof EntitlementError) {
    return { success: false, error: error.message, code: error.code };
  }

  if (
    error instanceof PermissionError ||
    error instanceof WorkspaceError
  ) {
    return { success: false, error: error.message };
  }

  const dbError = await mapDatabaseUnavailableActionError(error, locale);
  if (dbError) {
    return dbError;
  }

  return { success: false, error: "Something went wrong.", code: "GENERIC" };
}

type CreateWorkspaceActionInput = {
  name: string;
  industry: WorkspaceIndustry;
  industryOtherText?: string;
  appearanceTheme?: WorkspaceAppearanceTheme;
  companyDescription?: string | null;
  plan?: SubscriptionPlan;
};

export async function createWorkspaceOnboardingAction(
  input: CreateWorkspaceActionInput,
  locale: Locale = "pl",
): Promise<ActionResult<CreateWorkspaceResult>> {
  return createWorkspaceAndActivate(input, locale, "onboarding");
}

export async function createAdditionalWorkspaceAction(
  input: CreateWorkspaceActionInput,
  locale: Locale = "pl",
): Promise<ActionResult<CreateWorkspaceResult>> {
  return createWorkspaceAndActivate(input, locale, "additional");
}

async function createWorkspaceAndActivate(
  input: CreateWorkspaceActionInput,
  locale: Locale,
  flow: "onboarding" | "additional",
): Promise<ActionResult<CreateWorkspaceResult>> {
  let userId: string | undefined;

  try {
    const user = await requireAuth(locale);
    userId = user.id;

    // First workspace (onboarding) is always frictionless FREE; only additional workspaces
    // may pick a paid plan.
    const plan: SubscriptionPlan = flow === "onboarding" ? "FREE" : input.plan ?? "FREE";

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
      plan,
      locale,
    });

    await processReferralCookieForWorkspace({
      workspaceId: workspace.id,
      ownerUserId: user.id,
      expectedPlan: plan !== "FREE" ? plan : null,
    });

    const { ensureReferralProfile } = await import(
      "@/features/referrals/server/user-referral-profile-service"
    );
    await ensureReferralProfile(user.id);

    // Paid plans are provisioned INCOMPLETE; send the owner to Stripe checkout.
    let checkoutUrl: string | null = null;
    if (plan !== "FREE") {
      const result = await changeWorkspaceSubscriptionPlan({
        workspaceId: workspace.id,
        plan,
      });
      checkoutUrl = result.kind === "checkout" ? result.url : null;
    }

    await persistActiveWorkspace(user.id, workspace.id);

    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/dashboard/${workspace.slug}`);
    revalidatePath(`/${locale}/dashboard/onboarding`);
    revalidatePath(`/${locale}/dashboard/workspaces/new`);

    return { success: true, data: { workspace, checkoutUrl } };
  } catch (error) {
    logMutationActionFailure(
      "create_workspace_failed",
      { flow, userId, industry: input.industry },
      error,
    );
    return toActionError(error, locale);
  }
}
