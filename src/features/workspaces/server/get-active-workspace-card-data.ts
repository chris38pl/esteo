import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import { prisma } from "@/db/client";

export type WorkspaceMemberPreview = {
  id: string;
  name: string;
  imageUrl: string | null;
  avatarPreset: AvatarPreset | null;
};

export type ActiveWorkspaceMembersData = {
  previews: WorkspaceMemberPreview[];
  totalCount: number;
};

const VISIBLE_MEMBER_LIMIT = 3;

export async function getActiveWorkspaceMembersData(
  workspaceId: string,
): Promise<ActiveWorkspaceMembersData> {
  const where = {
    workspaceId,
    deletedAt: null,
    workspace: { deletedAt: null },
  };

  const [totalCount, members] = await Promise.all([
    prisma.workspaceMember.count({ where }),
    prisma.workspaceMember.findMany({
      where,
      take: VISIBLE_MEMBER_LIMIT,
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            avatarPreset: true,
          },
        },
      },
    }),
  ]);

  return {
    totalCount,
    previews: members.map((member) => ({
      id: member.user.id,
      name: member.user.name?.trim() || "Member",
      imageUrl: member.user.avatarUrl,
      avatarPreset: isAvatarPreset(member.user.avatarPreset) ? member.user.avatarPreset : null,
    })),
  };
}

/** @deprecated Use getActiveWorkspaceMembersData */
export async function getActiveWorkspaceMemberPreviews(
  workspaceId: string,
  limit = 2,
): Promise<WorkspaceMemberPreview[]> {
  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      workspace: { deletedAt: null },
    },
    take: limit,
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          avatarPreset: true,
        },
      },
    },
  });

  return members.map((member) => ({
    id: member.user.id,
    name: member.user.name?.trim() || "Member",
    imageUrl: member.user.avatarUrl,
    avatarPreset: isAvatarPreset(member.user.avatarPreset) ? member.user.avatarPreset : null,
  }));
}
