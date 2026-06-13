import type { AvatarPreset } from "@/components/avatars/user-avatar";

export const AVATAR_PRESETS: readonly AvatarPreset[] = [
  "accountant",
  "architect",
  "carpenter",
  "constructor",
  "electrician",
  "engineer",
] as const;

export function isAvatarPreset(value: string | null | undefined): value is AvatarPreset {
  return Boolean(value && AVATAR_PRESETS.includes(value as AvatarPreset));
}

export function pickDefaultAvatarPreset(seed: string): AvatarPreset {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return AVATAR_PRESETS[hash % AVATAR_PRESETS.length] ?? "architect";
}

export type ResolvedUserAvatar = {
  imageUrl: string | null;
  avatarPreset: AvatarPreset | null;
};

export function resolveUserAvatar(input: {
  avatarUrl: string | null;
  avatarPreset: string | null;
  hasClerkImage: boolean;
  clerkImageUrl: string | null;
}): ResolvedUserAvatar {
  if (input.hasClerkImage && input.clerkImageUrl?.trim()) {
    return {
      imageUrl: input.clerkImageUrl,
      avatarPreset: null,
    };
  }

  const preset = isAvatarPreset(input.avatarPreset) ? input.avatarPreset : null;

  if (input.avatarUrl?.trim()) {
    return {
      imageUrl: input.avatarUrl,
      avatarPreset: preset,
    };
  }

  return {
    imageUrl: null,
    avatarPreset: preset,
  };
}

export function toCurrentUserProfile(user: {
  name: string | null;
  email: string;
  avatarUrl: string | null;
  avatarPreset: string | null;
  avatarSource?: "CLERK" | "PRESET";
}): {
  name: string | null;
  email: string;
  avatarUrl: string | null;
  avatarPreset: AvatarPreset | null;
  avatarSource: "CLERK" | "PRESET";
} {
  const preset = isAvatarPreset(user.avatarPreset) ? user.avatarPreset : null;
  const source = user.avatarSource ?? (user.avatarUrl ? "CLERK" : "PRESET");

  return {
    name: user.name,
    email: user.email,
    avatarUrl: source === "PRESET" ? null : user.avatarUrl,
    avatarPreset: preset,
    avatarSource: source,
  };
}
