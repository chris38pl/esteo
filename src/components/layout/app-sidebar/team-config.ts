import type { AvatarPreset } from "@/components/avatars/user-avatar";

export type TeamMember = {
  key: string;
  nameKey: "members.owner" | "members.colleagueA" | "members.colleagueB";
  imageUrl?: string | null;
  avatarPreset?: AvatarPreset | null;
};

/** Placeholder until workspace members are loaded from the API. */
export const teamMembers: TeamMember[] = [
  {
    key: "owner",
    nameKey: "members.owner",
    avatarPreset: "architect",
  },
  {
    key: "colleague-a",
    nameKey: "members.colleagueA",
    avatarPreset: "engineer",
  },
  {
    key: "colleague-b",
    nameKey: "members.colleagueB",
    avatarPreset: "electrician",
  },
];
