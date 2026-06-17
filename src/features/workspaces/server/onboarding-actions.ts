"use server";

import type {
  SubscriptionPlan,
  WorkspaceAppearanceTheme,
  WorkspaceIndustry,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { changeWorkspaceSubscriptionPlan } from "@/features/billing/server/billing-service";
import { createWorkspace } from "@/features/workspaces/server/service";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { persistActiveWorkspace } from "@/server/workspaces/active-workspace";
import {
  EntitlementError,
  PermissionError,
  WorkspaceError,
} from "@/server/permissions/errors";

type CreateWorkspaceResult = {
  workspace: Awaited<ReturnType<typeof createWorkspace>>;
  /** When set, the workspace is INCOMPLETE and the client must redirect to Stripe checkout. */
  checkoutUrl: string | null;
};

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
  try {
    const user = await requireAuth(locale);

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

    // Paid plans are provisioned INCOMPLETE; send the owner to Stripe checkout. The webhook
    // (checkout.session.completed) activates the workspace + subscription.
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
    return toActionError(error);
  }
}
