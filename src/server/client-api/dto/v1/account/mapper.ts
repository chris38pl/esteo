import type { AccountProfile } from "@/server/client-api/dto/v1/account/dto";

/**
 * Minimal user shape the mapper depends on. Kept structural (not the Prisma
 * `User`) so this module never imports `@prisma/client`.
 */
export type AccountProfileInput = {
  id: string;
  email: string;
  name: string | null;
  avatarPreset: string | null;
  avatarSource: "CLERK" | "PRESET";
  avatarUrl: string | null;
};

/** Pure: user -> AccountProfile DTO. */
export function toAccountProfile(user: AccountProfileInput): AccountProfile {
  const isPreset = user.avatarSource === "PRESET";
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarPreset: isPreset ? user.avatarPreset : null,
    avatarSource: user.avatarSource,
    avatarUrl: isPreset ? null : user.avatarUrl,
  };
}
