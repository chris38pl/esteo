import { prisma } from "@/db/client";

const pendingInvitationWhere = (email: string) => ({
  email: email.toLowerCase(),
  status: "PENDING" as const,
  expiresAt: { gt: new Date() },
  workspace: { deletedAt: null },
});

export async function listReceivedInvitations(email: string) {
  return prisma.workspaceInvitation.findMany({
    where: pendingInvitationWhere(email),
    include: {
      workspace: true,
      invitedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function countPendingInvitations(email: string): Promise<number> {
  return prisma.workspaceInvitation.count({
    where: pendingInvitationWhere(email),
  });
}

export async function hasPendingInvitations(email: string): Promise<boolean> {
  const count = await countPendingInvitations(email);
  return count > 0;
}

export async function getNextModalInvitation(email: string) {
  return prisma.workspaceInvitation.findFirst({
    where: {
      ...pendingInvitationWhere(email),
      promptDismissedAt: null,
    },
    include: {
      workspace: true,
      invitedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function findReceivedInvitationById(email: string, invitationId: string) {
  return prisma.workspaceInvitation.findFirst({
    where: {
      id: invitationId,
      email: email.toLowerCase(),
      status: "PENDING",
      expiresAt: { gt: new Date() },
      workspace: { deletedAt: null },
    },
    include: {
      workspace: true,
      invitedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}
