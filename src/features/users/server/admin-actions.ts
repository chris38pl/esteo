"use server";

import { SubscriptionPlan } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { adminSetUserPlan } from "@/features/users/server/admin-users";
import type { Locale } from "@/lib/locale";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";
import { PermissionError } from "@/server/permissions/errors";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const PLANS = new Set<string>(Object.values(SubscriptionPlan));

function isSubscriptionPlan(value: string): value is SubscriptionPlan {
  return PLANS.has(value);
}

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError) {
    return { success: false, error: error.message };
  }

  console.error(error);
  return { success: false, error: "Something went wrong." };
}

function revalidateAdminUsers(locale: Locale) {
  revalidatePath(`/${locale}/dashboard/admin/users`);
}

export async function adminSetUserPlanAction(
  userId: string,
  plan: SubscriptionPlan,
  locale: Locale = "pl",
) {
  try {
    const admin = await assertPlatformAdminAccess(locale);

    if (!isSubscriptionPlan(plan)) {
      return { success: false as const, error: "Invalid plan." };
    }

    const subscription = await adminSetUserPlan(admin, userId, plan);
    revalidateAdminUsers(locale);
    revalidatePath(`/${locale}/dashboard/billing`);
    revalidatePath(`/${locale}/dashboard`);
    return { success: true as const, data: subscription };
  } catch (error) {
    return toActionError(error);
  }
}
