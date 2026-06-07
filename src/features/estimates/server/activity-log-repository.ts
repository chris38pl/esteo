import "server-only";

import type {
  EstimateActivityActorType,
  EstimateActivityCategory,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/db/client";

const COALESCE_WINDOW_MS = 5 * 60 * 1000;
const LIST_LIMIT = 100;

const actorSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  avatarPreset: true,
} as const;

export type EstimateActivityLogRow = {
  id: string;
  estimateId: string;
  workspaceId: string;
  actorType: EstimateActivityActorType;
  actorUserId: string | null;
  category: EstimateActivityCategory;
  action: string;
  metadata: Prisma.JsonValue;
  occurredAt: Date;
  createdAt: Date;
  actor: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    avatarPreset: string | null;
  } | null;
};

export type ActivityMetadataRecord = {
  versionNumber?: number;
  oldMargin?: number;
  newMargin?: number;
  source?: string;
  installmentName?: string;
  installmentAmount?: number;
  paymentAmount?: number;
  currency?: string;
  presetId?: string;
  installmentCount?: number;
};

export async function createActivityLog(input: {
  estimateId: string;
  workspaceId: string;
  actorType: EstimateActivityActorType;
  actorUserId: string | null;
  category: EstimateActivityCategory;
  action: string;
  metadata?: ActivityMetadataRecord;
  occurredAt?: Date;
}): Promise<void> {
  await prisma.estimateActivityLog.create({
    data: {
      estimateId: input.estimateId,
      workspaceId: input.workspaceId,
      actorType: input.actorType,
      actorUserId: input.actorUserId,
      category: input.category,
      action: input.action,
      metadata: input.metadata ?? undefined,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}

function metadataEquals(
  a: ActivityMetadataRecord | null,
  b: ActivityMetadataRecord,
  keys: (keyof ActivityMetadataRecord)[],
): boolean {
  if (!a) return false;
  return keys.every((key) => a[key] === b[key]);
}

function parseMetadata(value: Prisma.JsonValue): ActivityMetadataRecord | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as ActivityMetadataRecord;
}

export async function coalesceOrCreateActivity(input: {
  estimateId: string;
  workspaceId: string;
  actorType: EstimateActivityActorType;
  actorUserId: string | null;
  category: EstimateActivityCategory;
  action: string;
  metadata: ActivityMetadataRecord;
  mergeMetadata?: (
    existing: ActivityMetadataRecord,
    incoming: ActivityMetadataRecord,
  ) => ActivityMetadataRecord;
  matchMetadataKeys: (keyof ActivityMetadataRecord)[];
}): Promise<void> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - COALESCE_WINDOW_MS);

  const recent = await prisma.estimateActivityLog.findFirst({
    where: {
      estimateId: input.estimateId,
      action: input.action,
      actorType: input.actorType,
      actorUserId: input.actorUserId,
      occurredAt: { gte: windowStart },
    },
    orderBy: { occurredAt: "desc" },
  });

  if (
    recent &&
    metadataEquals(parseMetadata(recent.metadata), input.metadata, input.matchMetadataKeys)
  ) {
    const existingMeta = parseMetadata(recent.metadata) ?? {};
    const merged = input.mergeMetadata
      ? input.mergeMetadata(existingMeta, input.metadata)
      : existingMeta;

    await prisma.estimateActivityLog.update({
      where: { id: recent.id },
      data: {
        occurredAt: now,
        metadata: merged,
      },
    });
    return;
  }

  await createActivityLog({
    ...input,
    metadata: input.metadata,
    occurredAt: now,
  });
}

export async function listActivityLogsByEstimateId(
  estimateId: string,
): Promise<EstimateActivityLogRow[]> {
  return prisma.estimateActivityLog.findMany({
    where: { estimateId },
    orderBy: { occurredAt: "desc" },
    take: LIST_LIMIT,
    include: {
      actor: { select: actorSelect },
    },
  });
}
