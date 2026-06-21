import "server-only";

import { RequestStagingAttachmentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/db/client";
import { parseRequestAttachmentRecords } from "@/features/attachments/lib/request-attachment-metadata";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";

export type DbStorageKeyRef = {
  storageKey: string;
  source: string;
  recordId: string;
};

export async function collectAllDbStorageKeyRefs(): Promise<DbStorageKeyRef[]> {
  const refs: DbStorageKeyRef[] = [];

  const [estimateAttachments, stagingRows, issueAttachments, estimatePdfs, workspaceSettings] =
    await Promise.all([
      prisma.estimateAttachment.findMany({
        select: {
          id: true,
          storageKey: true,
          thumbnailStorageKey: true,
        },
      }),
      prisma.requestStagingAttachment.findMany({
        where: { storageKey: { not: null } },
        select: { id: true, storageKey: true },
      }),
      prisma.issueAttachment.findMany({
        select: { id: true, storageKey: true },
      }),
      prisma.estimatePdf.findMany({
        where: { fileKey: { not: null } },
        select: { id: true, fileKey: true },
      }),
      prisma.workspaceSettings.findMany({
        select: { workspaceId: true, branding: true },
      }),
    ]);

  for (const row of estimateAttachments) {
    refs.push({
      storageKey: row.storageKey,
      source: "estimate_attachment",
      recordId: row.id,
    });

    if (row.thumbnailStorageKey) {
      refs.push({
        storageKey: row.thumbnailStorageKey,
        source: "estimate_attachment_thumb",
        recordId: `${row.id}-thumb`,
      });
    }
  }

  for (const row of stagingRows) {
    if (row.storageKey) {
      refs.push({
        storageKey: row.storageKey,
        source: "staging",
        recordId: row.id,
      });
    }
  }

  for (const row of issueAttachments) {
    refs.push({
      storageKey: row.storageKey,
      source: "issue",
      recordId: row.id,
    });
  }

  for (const row of estimatePdfs) {
    if (row.fileKey) {
      refs.push({
        storageKey: row.fileKey,
        source: "pdf",
        recordId: row.id,
      });
    }
  }

  for (const settings of workspaceSettings) {
    const branding = workspaceBrandingSchema.safeParse(settings.branding);
    const logoKey = branding.success ? branding.data.logoStorageKey : undefined;

    if (logoKey) {
      refs.push({
        storageKey: logoKey,
        source: "logo",
        recordId: settings.workspaceId,
      });
    }
  }

  const requests = await prisma.estimateRequest.findMany({
    where: { attachments: { not: Prisma.DbNull } },
    select: { id: true, attachments: true },
  });

  for (const request of requests) {
    for (const record of parseRequestAttachmentRecords(request.attachments)) {
      if (record.storageKey) {
        refs.push({
          storageKey: record.storageKey,
          source: "request_json",
          recordId: `${request.id}:${record.id}`,
        });
      }

      if (record.thumbnailStorageKey) {
        refs.push({
          storageKey: record.thumbnailStorageKey,
          source: "request_json_thumb",
          recordId: `${request.id}:${record.id}-thumb`,
        });
      }
    }
  }

  return refs;
}

export async function collectAllDbStorageKeys(): Promise<Set<string>> {
  const refs = await collectAllDbStorageKeyRefs();
  return new Set(refs.map((ref) => ref.storageKey));
}

/** Blob keys referenced by live rows (excludes request JSON metadata-only refs). */
export async function collectCanonicalBlobStorageKeys(): Promise<Set<string>> {
  const refs = await collectAllDbStorageKeyRefs();
  return new Set(
    refs
      .filter((ref) => !ref.source.startsWith("request_json"))
      .map((ref) => ref.storageKey),
  );
}

export async function collectLinkedStagingKeys(): Promise<Set<string>> {
  const rows = await prisma.requestStagingAttachment.findMany({
    where: {
      status: RequestStagingAttachmentStatus.LINKED,
      storageKey: { not: null },
    },
    select: { storageKey: true },
  });

  return new Set(
    rows.map((row) => row.storageKey).filter((key): key is string => key !== null),
  );
}

export function findDuplicateDbKeys(refs: DbStorageKeyRef[]): Map<string, DbStorageKeyRef[]> {
  const byKey = new Map<string, DbStorageKeyRef[]>();

  for (const ref of refs) {
    const existing = byKey.get(ref.storageKey) ?? [];
    existing.push(ref);
    byKey.set(ref.storageKey, existing);
  }

  const duplicates = new Map<string, DbStorageKeyRef[]>();

  for (const [key, keyRefs] of byKey) {
    if (keyRefs.length > 1) {
      duplicates.set(key, keyRefs);
    }
  }

  return duplicates;
}

export function isLegacyRequestStorageKey(storageKey: string): boolean {
  return storageKey.includes("/requests/");
}
