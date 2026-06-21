import "server-only";

import type { OpsCaseSeverity, OpsCaseSource, OpsCaseType, Prisma } from "@prisma/client";

import {
  computeOpsCaseDueAt,
  getOpsCaseCatalogEntry,
} from "@/features/ops-cases/lib/ops-case-catalog";
import { allocateOpsCaseNumber } from "@/features/ops-cases/server/allocate-ops-case-number";
import {
  bumpActiveOpsCaseOccurrence,
  createOpsCaseRecord,
  findActiveOpsCaseByDedupeKey,
} from "@/features/ops-cases/server/repository";

export type EmitOpsCaseInput = {
  type: OpsCaseType;
  source: OpsCaseSource;
  dedupeKey: string;
  title: string;
  summary: string;
  payload: Prisma.InputJsonValue;
  severity?: OpsCaseSeverity;
  fingerprint?: string;
  affectedUserId?: string | null;
  actorUserId?: string | null;
  workspaceId?: string | null;
  entityKind?: string | null;
  entityId?: string | null;
};

export type EmitOpsCaseResult =
  | { action: "created"; caseNumber: number; caseId: string }
  | { action: "bumped"; caseNumber: number; caseId: string };

export async function emitOpsCase(input: EmitOpsCaseInput): Promise<EmitOpsCaseResult> {
  const catalog = getOpsCaseCatalogEntry(input.type);
  const severity = input.severity ?? catalog.defaultSeverity;
  const fingerprint = input.fingerprint ?? catalog.fingerprint;
  const now = new Date();

  const activeCase = await findActiveOpsCaseByDedupeKey(input.dedupeKey);

  if (activeCase) {
    const bumped = await bumpActiveOpsCaseOccurrence(activeCase.id);
    return {
      action: "bumped",
      caseNumber: bumped.number,
      caseId: bumped.id,
    };
  }

  const number = await allocateOpsCaseNumber();
  const created = await createOpsCaseRecord({
    number,
    type: input.type,
    source: input.source,
    severity,
    dedupeKey: input.dedupeKey,
    fingerprint,
    title: input.title,
    summary: input.summary,
    payload: input.payload,
    dueAt: computeOpsCaseDueAt(severity, now),
    firstSeenAt: now,
    lastSeenAt: now,
    occurrenceCount: 1,
    ...(input.affectedUserId
      ? { affectedUser: { connect: { id: input.affectedUserId } } }
      : {}),
    ...(input.actorUserId ? { actorUser: { connect: { id: input.actorUserId } } } : {}),
    ...(input.workspaceId ? { workspace: { connect: { id: input.workspaceId } } } : {}),
    entityKind: input.entityKind ?? null,
    entityId: input.entityId ?? null,
  });

  return {
    action: "created",
    caseNumber: created.number,
    caseId: created.id,
  };
}

export function fireOpsCase(promise: Promise<EmitOpsCaseResult>): void {
  void promise.catch((error) => {
    console.error("[ops-cases]", error);
  });
}
