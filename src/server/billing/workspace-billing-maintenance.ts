import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";
import { isUniqueConstraintError } from "@/lib/database/is-unique-constraint-error";

/**
 * Recomputes the denormalized `Workspace.isActiveFree` flag for a workspace. This is the SINGLE
 * writer of that flag (the partial unique index `Workspace(ownerId) WHERE isActiveFree` is the
 * hard backstop). A workspace is the owner's active free slot iff its plan is FREE, its
 * subscription is in an active state, and it is neither archived nor soft-deleted.
 *
 * Setting the flag true can race the unique index (two frees for one owner); the violation is
 * swallowed and the flag left false so the resolver stays consistent with the DB guarantee.
 */
export async function recomputeIsActiveFree(workspaceId: string): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      deletedAt: true,
      archivedAt: true,
      isActiveFree: true,
      billingAccount: {
        select: { subscription: { select: { plan: true, status: true } } },
      },
    },
  });

  if (!workspace) {
    return;
  }

  const sub = workspace.billingAccount?.subscription ?? null;
  const shouldBeFree =
    !workspace.deletedAt &&
    !workspace.archivedAt &&
    (sub?.plan ?? "FREE") === "FREE" &&
    (sub === null || sub.status === "ACTIVE" || sub.status === "TRIAL");

  if (shouldBeFree === workspace.isActiveFree) {
    return;
  }

  try {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { isActiveFree: shouldBeFree },
    });
  } catch (error) {
    if (shouldBeFree && isUniqueConstraintError(error)) {
      // Another active free workspace already holds the owner's slot; leave this one false.
      return;
    }
    throw error;
  }
}

/** Transaction-scoped advisory lock serializing per-owner billing/free-slot mutations. */
export async function lockOwner(
  tx: Prisma.TransactionClient,
  ownerUserId: string,
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ownerUserId}))`;
}
