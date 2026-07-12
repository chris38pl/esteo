"use server";

import { revalidatePath } from "next/cache";

import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { updateUserAvatarPreset } from "@/features/users/server/profile-service";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function updateUserAvatarPresetAction(
  preset: AvatarPreset,
  locale: Locale,
): Promise<ActionResult<{ preset: AvatarPreset }>> {
  try {
    if (!isAvatarPreset(preset)) {
      return { success: false, error: "Invalid avatar preset." };
    }

    const user = await requireAuth(locale);

    await updateUserAvatarPreset(user.id, preset);

    revalidatePath(`/${locale}/dashboard`, "layout");

    return { success: true, data: { preset } };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Something went wrong." };
  }
}
