import "server-only";

import type { PlatformRole } from "@prisma/client";

import { prisma } from "@/db/client";
import type { RecipientToken } from "@/features/notifications/lib/notification-types";

export type ResolveRecipientsInput = {
  token: RecipientToken;
  workspaceId?: string;
  actorUserId?: string | null;
  inviteeEmail?: string;
  referrerUserId?: string;
  userIds?: string[];
};

export async function resolveRecipients(input: ResolveRecipientsInput): Promise<string[]> {
  switch (input.token) {
    case "workspace_owner": {
      if (!input.workspaceId) return [];
      const workspace = await prisma.workspace.findUnique({
        where: { id: input.workspaceId },
        select: { ownerId: true },
      });
      return workspace ? [workspace.ownerId] : [];
    }
    case "workspace_owner_and_estimators": {
      return resolveRecipients({ ...input, token: "workspace_owner" });
    }
    case "workspace_members": {
      if (!input.workspaceId) return [];
      const members = await prisma.workspaceMember.findMany({
        where: {
          workspaceId: input.workspaceId,
          state: "ACTIVE",
          ...(input.actorUserId ? { userId: { not: input.actorUserId } } : {}),
        },
        select: { userId: true },
      });
      return members.map((m) => m.userId);
    }
    case "billing_payer": {
      if (!input.workspaceId) return [];
      const account = await prisma.billingAccount.findFirst({
        where: { workspaceId: input.workspaceId },
        select: { payerUserId: true, ownerUserId: true },
      });
      if (!account) return [];
      return [account.payerUserId ?? account.ownerUserId];
    }
    case "invitee_by_email": {
      if (!input.inviteeEmail) return [];
      const user = await prisma.user.findUnique({
        where: { email: input.inviteeEmail },
        select: { id: true, deletedAt: true },
      });
      if (!user || user.deletedAt) return [];
      return [user.id];
    }
    case "referrer_user": {
      return input.referrerUserId ? [input.referrerUserId] : [];
    }
    case "platform_role_qa_testers": {
      const testers = await prisma.user.findMany({
        where: {
          platformRole: "QA_TESTER" satisfies PlatformRole,
          deletedAt: null,
        },
        select: { id: true },
      });
      return testers.map((t) => t.id);
    }
    case "explicit_user_ids": {
      return input.userIds ?? [];
    }
    default:
      return [];
  }
}
