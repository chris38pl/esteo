"use server";

import { revalidatePath } from "next/cache";

import { updateOpsCaseStatusSchema } from "@/features/ops-cases/schemas/ops-case";
import {
  getOpsCaseByNumber,
  listOpsCasesForAdmin,
  updateOpsCaseStatus,
  type OpsCaseSummaryCounts,
} from "@/features/ops-cases/server/repository";
import type { Locale } from "@/lib/locale";
import { canAccessOpsCases } from "@/server/permissions/can-access-ops-cases";
import { syncUserFromClerk } from "@/server/auth/sync-user";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function revalidateOpsCasePaths(locale: Locale, number?: number) {
  const base = `/${locale}/dashboard/admin/ops-cases`;
  revalidatePath(base);
  if (number !== undefined) {
    revalidatePath(`${base}/${number}`);
  }
}

async function assertOpsCaseAdminAccess(): Promise<{ userId: string }> {
  const user = await syncUserFromClerk();
  if (!user) {
    throw new Error("Unauthorized.");
  }
  if (!canAccessOpsCases(user)) {
    throw new Error("Forbidden.");
  }
  return { userId: user.id };
}

export async function listAdminOpsCasesAction(locale: Locale = "pl") {
  try {
    await assertOpsCaseAdminAccess();
    const items = await listOpsCasesForAdmin();
    return { success: true as const, data: items };
  } catch (error) {
    console.error("[listAdminOpsCasesAction]", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to load ops cases.",
    };
  }
}

export async function getAdminOpsCaseAction(number: number, locale: Locale = "pl") {
  try {
    await assertOpsCaseAdminAccess();
    const item = await getOpsCaseByNumber(number);
    if (!item) {
      return { success: false as const, error: "Ops case not found." };
    }
    return { success: true as const, data: item };
  } catch (error) {
    console.error("[getAdminOpsCaseAction]", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to load ops case.",
    };
  }
}

export async function updateOpsCaseStatusAction(
  input: unknown,
  locale: Locale = "pl",
): Promise<ActionResult<{ number: number; status: "RESOLVED" | "IGNORED" }>> {
  try {
    const { userId } = await assertOpsCaseAdminAccess();
    const parsed = updateOpsCaseStatusSchema.parse(input);

    const updated = await updateOpsCaseStatus({
      number: parsed.number,
      status: parsed.status,
      resolutionNotes: parsed.resolutionNotes,
      resolvedById: userId,
    });

    if (!updated) {
      return { success: false, error: "Ops case not found." };
    }

    revalidateOpsCasePaths(locale, parsed.number);
    return {
      success: true,
      data: { number: updated.number, status: parsed.status },
    };
  } catch (error) {
    console.error("[updateOpsCaseStatusAction]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update ops case.",
    };
  }
}

export type { OpsCaseSummaryCounts };
