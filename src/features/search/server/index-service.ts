import "server-only";

import type { SearchEntityType } from "@prisma/client";

import { prisma } from "@/db/client";

import {
  softDeleteSearchDocument,
  upsertSearchDocumentForAttachment,
  upsertSearchDocumentForEstimate,
  upsertSearchDocumentForInquiry,
  upsertSearchDocumentsForRequestAttachments,
} from "./index-upsert";

export {
  softDeleteSearchDocument,
  upsertSearchDocumentForAttachment,
  upsertSearchDocumentForEstimate,
  upsertSearchDocumentForInquiry,
  upsertSearchDocumentsForRequestAttachments,
} from "./index-upsert";

const pending = new Set<string>();

function indexKey(workspaceId: string, entityType: SearchEntityType, entityId: string): string {
  return `${workspaceId}:${entityType.toLowerCase()}:${entityId}`;
}

export function scheduleSearchIndex(input: {
  workspaceId: string;
  entityType: SearchEntityType;
  entityId: string;
  run: () => Promise<void>;
}): void {
  const key = indexKey(input.workspaceId, input.entityType, input.entityId);
  if (pending.has(key)) {
    return;
  }

  pending.add(key);
  void input
    .run()
    .catch((error) => {
      console.error("[search-index]", { key, error });
    })
    .finally(() => {
      pending.delete(key);
    });
}

export function scheduleUpsertSearchDocumentForEstimate(estimateId: string): void {
  void prisma.estimate
    .findUnique({ where: { id: estimateId }, select: { workspaceId: true } })
    .then((estimate) => {
      if (!estimate) {
        return;
      }
      scheduleSearchIndex({
        workspaceId: estimate.workspaceId,
        entityType: "ESTIMATE",
        entityId: estimateId,
        run: () => upsertSearchDocumentForEstimate(estimateId),
      });
    })
    .catch((error) => console.error("[search-index] schedule estimate", error));
}

export function scheduleUpsertSearchDocumentForInquiry(requestId: string): void {
  void prisma.estimateRequest
    .findUnique({ where: { id: requestId }, select: { workspaceId: true } })
    .then((request) => {
      if (!request) {
        return;
      }
      scheduleSearchIndex({
        workspaceId: request.workspaceId,
        entityType: "INQUIRY",
        entityId: requestId,
        run: () => upsertSearchDocumentForInquiry(requestId),
      });
    })
    .catch((error) => console.error("[search-index] schedule inquiry", error));
}

export function scheduleUpsertSearchDocumentForAttachment(attachmentId: string): void {
  void prisma.estimateAttachment
    .findUnique({ where: { id: attachmentId }, select: { workspaceId: true } })
    .then((attachment) => {
      if (!attachment) {
        return;
      }
      scheduleSearchIndex({
        workspaceId: attachment.workspaceId,
        entityType: "ATTACHMENT",
        entityId: attachmentId,
        run: () => upsertSearchDocumentForAttachment(attachmentId),
      });
    })
    .catch((error) => console.error("[search-index] schedule attachment", error));
}

export function scheduleUpsertSearchDocumentsForRequestAttachments(requestId: string): void {
  void prisma.estimateRequest
    .findUnique({ where: { id: requestId }, select: { workspaceId: true } })
    .then((request) => {
      if (!request) {
        return;
      }
      scheduleSearchIndex({
        workspaceId: request.workspaceId,
        entityType: "ATTACHMENT",
        entityId: `request:${requestId}`,
        run: () => upsertSearchDocumentsForRequestAttachments(requestId),
      });
    })
    .catch((error) => console.error("[search-index] schedule request attachments", error));
}

export function scheduleSoftDeleteSearchDocument(
  workspaceId: string,
  entityType: SearchEntityType,
  entityId: string,
): void {
  scheduleSearchIndex({
    workspaceId,
    entityType,
    entityId,
    run: () => softDeleteSearchDocument(workspaceId, entityType, entityId),
  });
}
