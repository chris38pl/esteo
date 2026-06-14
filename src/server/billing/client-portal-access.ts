import { prisma } from "@/db/client";
import { getWorkspaceEffectiveStatus } from "@/server/billing/effective-status";

/** Grace window (days) after EXPIRED during which public client pages stay read-only. */
export const CLIENT_PORTAL_GRACE_DAYS = 30;

export type ClientPortalAccess = "ACTIVE" | "GRACE_READ_ONLY" | "INACTIVE";

/**
 * Determines whether a public client-facing page (e.g. `/wycena/{slug}`) should be served.
 * End-clients get a wind-down window after billing expires before seeing an inactive notice.
 */
export async function getClientPortalAccess(workspaceId: string): Promise<ClientPortalAccess> {
  const effectiveStatus = await getWorkspaceEffectiveStatus(workspaceId);

  if (!effectiveStatus || effectiveStatus === "ACTIVE" || effectiveStatus === "PAST_DUE") {
    return "ACTIVE";
  }

  if (effectiveStatus === "GRACE_PERIOD") {
    return "GRACE_READ_ONLY";
  }

  if (effectiveStatus === "EXPIRED" || effectiveStatus === "ARCHIVED") {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        billingAccount: {
          select: { subscription: { select: { graceEndsAt: true, updatedAt: true } } },
        },
      },
    });

    const sub = workspace?.billingAccount?.subscription;
    const reference = sub?.graceEndsAt ?? sub?.updatedAt ?? null;
    if (reference) {
      const graceEnd = new Date(reference.getTime() + CLIENT_PORTAL_GRACE_DAYS * 24 * 60 * 60 * 1000);
      if (new Date() <= graceEnd) {
        return "GRACE_READ_ONLY";
      }
    }

    return "INACTIVE";
  }

  return "INACTIVE";
}
