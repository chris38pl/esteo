import "server-only";

import { prisma } from "@/db/client";
import { ESTIMATE_ACTIVITY_ACTIONS, logEstimateActivity } from "@/features/estimates/server/activity-log";
import { assertEstimateInWorkspace } from "@/features/estimates/server/notes-repository";
import { assertCanReopen } from "@/features/estimates/lib/version-reopen";
import { PermissionError } from "@/server/permissions/errors";

async function getVersionForWorkflow(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
}) {
  const version = await prisma.estimateVersion.findFirst({
    where: {
      id: input.versionId,
      estimateId: input.estimateId,
      workspaceId: input.workspaceId,
    },
    select: {
      id: true,
      versionNumber: true,
      status: true,
      archivedAt: true,
    },
  });

  if (!version) {
    throw new PermissionError("Estimate version not found.");
  }

  if (version.archivedAt) {
    throw new PermissionError("Archived versions cannot be updated.");
  }

  return version;
}

export async function acceptEstimateVersion(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  userId: string;
  note?: string;
}): Promise<void> {
  await assertEstimateInWorkspace(input.estimateId, input.workspaceId);
  const version = await getVersionForWorkflow(input);

  if (version.status !== "SENT") {
    throw new PermissionError("Only sent versions can be accepted.");
  }

  const now = new Date();

  await prisma.estimateVersion.update({
    where: { id: input.versionId },
    data: {
      status: "ACCEPTED",
      statusChangedAt: now,
      acceptedAt: now,
      acceptedByUserId: input.userId,
    },
  });

  await logEstimateActivity({
    estimateId: input.estimateId,
    workspaceId: input.workspaceId,
    actorType: "USER",
    actorUserId: input.userId,
    category: "ESTIMATE",
    action: ESTIMATE_ACTIVITY_ACTIONS.estimate_accepted,
    metadata: {
      versionNumber: version.versionNumber,
      note: input.note,
    },
  });
}

export async function rejectEstimateVersion(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  userId: string;
  note?: string;
}): Promise<void> {
  await assertEstimateInWorkspace(input.estimateId, input.workspaceId);
  const version = await getVersionForWorkflow(input);

  if (version.status !== "SENT") {
    throw new PermissionError("Only sent versions can be rejected.");
  }

  const now = new Date();

  await prisma.estimateVersion.update({
    where: { id: input.versionId },
    data: {
      status: "REJECTED",
      statusChangedAt: now,
      rejectedAt: now,
      rejectedByUserId: input.userId,
    },
  });

  await logEstimateActivity({
    estimateId: input.estimateId,
    workspaceId: input.workspaceId,
    actorType: "USER",
    actorUserId: input.userId,
    category: "ESTIMATE",
    action: ESTIMATE_ACTIVITY_ACTIONS.estimate_rejected,
    metadata: {
      versionNumber: version.versionNumber,
      reason: input.note,
      note: input.note,
    },
  });
}

export async function reopenEstimateVersion(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  userId: string;
  note?: string;
}): Promise<void> {
  await assertEstimateInWorkspace(input.estimateId, input.workspaceId);
  const version = await getVersionForWorkflow(input);

  assertCanReopen(version);

  const now = new Date();

  await prisma.estimateVersion.update({
    where: { id: input.versionId },
    data: {
      status: "SENT",
      statusChangedAt: now,
    },
  });

  await logEstimateActivity({
    estimateId: input.estimateId,
    workspaceId: input.workspaceId,
    actorType: "USER",
    actorUserId: input.userId,
    category: "ESTIMATE",
    action: ESTIMATE_ACTIVITY_ACTIONS.estimate_reopened,
    metadata: {
      versionNumber: version.versionNumber,
      note: input.note,
      reason: input.note,
    },
  });
}
