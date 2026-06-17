import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import type { User } from "@prisma/client";

import { prisma } from "@/db/client";
import { assertUserCanDeleteAccount } from "@/features/users/server/account-deletion-guard";
import { PermissionError } from "@/server/permissions/errors";
import { isPlatformAdmin } from "@/server/permissions/require-workspace";

function deletedUserEmail(userId: string): string {
  return `deleted+${userId}@deleted.invalid`;
}

function deletedUserClerkId(userId: string): string {
  return `deleted:${userId}`;
}

export async function deleteUserAccount(user: User): Promise<void> {
  if (user.deletedAt) {
    throw new Error("Account already deleted.");
  }

  if (isPlatformAdmin(user)) {
    throw new PermissionError(
      "Platform administrators cannot delete their account through self-service.",
    );
  }

  await assertUserCanDeleteAccount(user.id);

  const originalClerkId = user.clerkId;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.workspaceMember.updateMany({
      where: { userId: user.id, deletedAt: null },
      data: { deletedAt: now },
    });

    await tx.pinnedEstimate.deleteMany({
      where: { userId: user.id },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        deletedAt: now,
        email: deletedUserEmail(user.id),
        clerkId: deletedUserClerkId(user.id),
        name: null,
        avatarUrl: null,
        avatarPreset: null,
        lastActiveWorkspaceId: null,
      },
    });
  });

  try {
    const client = await clerkClient();
    await client.users.deleteUser(originalClerkId);
  } catch (error) {
    if (
      isClerkAPIResponseError(error) &&
      (error.status === 404 || error.errors?.[0]?.code === "resource_not_found")
    ) {
      // User already deleted in Clerk — treat as success.
      return;
    }

    console.error("Failed to delete Clerk user after DB soft-delete", {
      userId: user.id,
      clerkId: originalClerkId,
      error,
    });
    throw new Error(
      "Your account was deactivated but we could not complete sign-out cleanup. Please try again or contact support.",
    );
  }
}
