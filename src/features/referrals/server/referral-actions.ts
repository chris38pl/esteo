"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  claimReferralForWorkspace,
  ReferralClaimError,
} from "@/features/referrals/server/referral-claim-service";
import { REFERRAL_COOKIE_NAME } from "@/features/referrals/lib/referral-cookie";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { WorkspaceError } from "@/server/permissions/errors";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

async function getClaimIpAddress(): Promise<string | null> {
  const headerStore = await headers();
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    null
  );
}

export async function processReferralCookieForWorkspace(params: {
  workspaceId: string;
  ownerUserId: string;
  expectedPlan?: import("@prisma/client").SubscriptionPlan | null;
}): Promise<void> {
  const cookieStore = await cookies();
  const linkCode = cookieStore.get(REFERRAL_COOKIE_NAME)?.value ?? null;
  if (!linkCode) {
    return;
  }

  try {
    await claimReferralForWorkspace({
      referredWorkspaceId: params.workspaceId,
      referredOwnerId: params.ownerUserId,
      linkCode,
      claimIpAddress: await getClaimIpAddress(),
      expectedPlan: params.expectedPlan ?? null,
    });
  } catch (error) {
    if (error instanceof ReferralClaimError) {
      console.info("Referral cookie claim skipped:", error.code, error.message);
      return;
    }
    console.error("Referral cookie claim failed:", error);
  }
}

export async function claimReferralAction(
  input: {
    workspaceId: string;
    workspaceSlug: string;
    emailOrCode: string;
  },
  locale: Locale = "pl",
): Promise<ActionResult<{ referralId: string }>> {
  try {
    const user = await requireAuth(locale);
    const workspace = await import("@/db/client").then(({ prisma }) =>
      prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        select: { ownerId: true, slug: true },
      }),
    );

    if (!workspace || workspace.ownerId !== user.id) {
      throw new WorkspaceError("Only the workspace owner can claim a referral.");
    }

    const result = await claimReferralForWorkspace({
      referredWorkspaceId: input.workspaceId,
      referredOwnerId: user.id,
      emailOrCode: input.emailOrCode,
      claimIpAddress: await getClaimIpAddress(),
    });

    if (!result) {
      return { success: false, error: "Referrer not found.", code: "NOT_FOUND" };
    }

    revalidatePath(`/${locale}/dashboard/${input.workspaceSlug}/referrals`);
    revalidatePath(`/${locale}/dashboard/${input.workspaceSlug}/settings`);

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ReferralClaimError) {
      return { success: false, error: error.message, code: error.code };
    }
    if (error instanceof WorkspaceError) {
      return { success: false, error: error.message };
    }
    console.error(error);
    return { success: false, error: "Something went wrong." };
  }
}
