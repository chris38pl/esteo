import type { SearchEntityType } from "@prisma/client";

import { prisma } from "@/db/client";
import { parseRequestAttachmentRecords } from "@/features/attachments/lib/request-attachment-metadata";

import {
  buildEstimateAttachmentSearchDocument,
  buildEstimateSearchDocument,
  buildInquirySearchDocument,
  buildRequestAttachmentSearchDocument,
  toPrismaMetadata,
  type BuiltSearchDocument,
} from "../lib/build-search-document";

async function upsertBuiltDocument(doc: BuiltSearchDocument): Promise<void> {
  await prisma.searchDocument.upsert({
    where: {
      workspaceId_entityType_entityId: {
        workspaceId: doc.workspaceId,
        entityType: doc.entityType,
        entityId: doc.entityId,
      },
    },
    create: {
      workspaceId: doc.workspaceId,
      workspaceSlugSnapshot: doc.workspaceSlugSnapshot,
      entityType: doc.entityType,
      entityId: doc.entityId,
      iconType: doc.iconType,
      title: doc.title,
      subtitle: doc.subtitle,
      searchText: doc.searchText,
      url: doc.url,
      metadata: toPrismaMetadata(doc.metadata),
      deletedAt: null,
    },
    update: {
      workspaceSlugSnapshot: doc.workspaceSlugSnapshot,
      iconType: doc.iconType,
      title: doc.title,
      subtitle: doc.subtitle,
      searchText: doc.searchText,
      url: doc.url,
      metadata: toPrismaMetadata(doc.metadata),
      deletedAt: null,
    },
  });
}

export async function softDeleteSearchDocument(
  workspaceId: string,
  entityType: SearchEntityType,
  entityId: string,
): Promise<void> {
  await prisma.searchDocument.updateMany({
    where: { workspaceId, entityType, entityId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

export async function upsertSearchDocumentForEstimate(estimateId: string): Promise<void> {
  const doc = await buildEstimateSearchDocument(estimateId);
  if (!doc) {
    await prisma.searchDocument.updateMany({
      where: { entityType: "ESTIMATE", entityId: estimateId },
      data: { deletedAt: new Date() },
    });
    return;
  }
  await upsertBuiltDocument(doc);
}

export async function upsertSearchDocumentForInquiry(requestId: string): Promise<void> {
  const doc = await buildInquirySearchDocument(requestId);
  if (!doc) {
    await prisma.searchDocument.updateMany({
      where: { entityType: "INQUIRY", entityId: requestId },
      data: { deletedAt: new Date() },
    });
    return;
  }
  await upsertBuiltDocument(doc);
}

export async function upsertSearchDocumentForAttachment(attachmentId: string): Promise<void> {
  const doc = await buildEstimateAttachmentSearchDocument(attachmentId);
  if (!doc) {
    await prisma.searchDocument.updateMany({
      where: { entityType: "ATTACHMENT", entityId: attachmentId },
      data: { deletedAt: new Date() },
    });
    return;
  }
  await upsertBuiltDocument(doc);
}

export async function upsertSearchDocumentsForRequestAttachments(
  requestId: string,
): Promise<void> {
  const request = await prisma.estimateRequest.findFirst({
    where: { id: requestId, deletedAt: null },
    select: { workspaceId: true, attachments: true },
  });

  if (!request) {
    return;
  }

  const records = parseRequestAttachmentRecords(request.attachments).filter(
    (record) => record.status === "stored" && !record.promotedAt,
  );

  const activeIds = new Set(records.map((record) => record.id));

  const existing = await prisma.searchDocument.findMany({
    where: {
      workspaceId: request.workspaceId,
      entityType: "ATTACHMENT",
      deletedAt: null,
      metadata: {
        path: ["requestId"],
        equals: requestId,
      },
    },
    select: { entityId: true },
  });

  for (const row of existing) {
    if (!activeIds.has(row.entityId)) {
      await softDeleteSearchDocument(request.workspaceId, "ATTACHMENT", row.entityId);
    }
  }

  for (const record of records) {
    const doc = await buildRequestAttachmentSearchDocument({ requestId, attachment: record });
    if (doc) {
      await upsertBuiltDocument(doc);
    }
  }
}
