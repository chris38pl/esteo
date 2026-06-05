import { toReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { listReceivedInvitations } from "@/features/workspaces/server/invitation-inbox";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import type { AvatarPreset } from "@/components/avatars/user-avatar";
import type { AvatarSource } from "@prisma/client";

export type UserSettingsPageData = {
  avatarUrl: string | null;
  avatarPreset: AvatarPreset | null;
  avatarSource: AvatarSource;
};

export async function getUserSettingsPageData(user: {
  id: string;
  email: string;
  avatarUrl: string | null;
  avatarPreset: string | null;
  avatarSource: AvatarSource;
}) {
  const invitations = await listReceivedInvitations(user.email);

  return {
    profile: {
      avatarUrl: user.avatarSource === "PRESET" ? null : user.avatarUrl,
      avatarPreset: isAvatarPreset(user.avatarPreset) ? user.avatarPreset : null,
      avatarSource: user.avatarSource,
    } satisfies UserSettingsPageData,
    invitations: invitations.map(toReceivedInvitationView),
  };
}
